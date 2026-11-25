"""
Build the numbered Repair run folder (database/REPAIR_RUN) from the source scripts.

    python build_run_folder.py

Source of truth = the scripts in docs/database/<db folder>/. The run folder is GENERATED:
never edit a file there; edit the source and rebuild. Each run file works both on the local
SQL Server (run_local.ps1 / sqlcmd) and on Azure SQL (SSMS, SQLCMD Mode), because the few
differences are decided at run time from SERVERPROPERTY('EngineEdition') (5 = Azure SQL DB).
"""
import json, os, re, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_ROOT = os.path.dirname(HERE)                      # docs/database
manifest = json.load(open(os.path.join(HERE, 'run_manifest.json'), encoding='utf-8'))
OUT = manifest['output_dir']
os.makedirs(OUT, exist_ok=True)
runs = manifest['runs']

# ---- manifest sanity -------------------------------------------------------
nos = [r['no'] for r in runs]
if nos != list(range(1, len(runs) + 1)):
    sys.exit('run numbers must be 1..N with no gaps, in order: %s' % nos)

SCHEMAS_MARKER = '-- ------------------------------------------------------------\n-- Schemas'
SYSADMIN_GUARD = "IF NOT (IS_ROLEMEMBER('gecko_system') = 1 OR IS_SRVROLEMEMBER('sysadmin') = 1)"
LOGIN_CHECK = "IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_app')\n   OR NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_system')"


def file_name(r):
    base = os.path.basename(r['src'])[:-4]
    if r.get('part') == 'local_create':
        base += '_LOCAL_ONLY'
    return '%03d_%s_%s_%s.sql' % (r['no'], r['phase'], r['db'], base)


def read_src(path):
    t = open(os.path.join(SRC_ROOT, path), encoding='utf-8-sig').read()
    return t.replace('\r\n', '\n')


def transform(r, text):
    """Return (body, list of change notes)."""
    notes = []
    part = r.get('part')
    if part == 'local_create':
        i = text.index(SCHEMAS_MARKER)
        notes.append('Only the master section of the source (CREATE DATABASE, RCSI, temporal retention). Local SQL Server only:')
        notes.append('  on Azure SQL this file does nothing — create the database in the portal instead (RUN_ORDER.md).')
        return text[:i].rstrip() + '\nGO\n', notes
    if part == 'objects':
        header_end = text.index('-- ====', text.index('-- ====') + 10)          # end of the top comment block
        header_end = text.index('\n', header_end) + 1
        i = text.index(SCHEMAS_MARKER)
        check = (
            "\nSET QUOTED_IDENTIFIER ON;\nSET ANSI_NULLS ON;\nGO\n\n"
            "-- Collation and RCSI are set when the database is created (the LOCAL_ONLY file locally,\n"
            "-- the portal on Azure). Checked here: neither can be fixed cheaply later.\n"
            "IF (SELECT collation_name FROM sys.databases WHERE name = DB_NAME()) <> 'Latin1_General_100_CI_AS_SC_UTF8'\n"
            "    THROW 50002, 'This database has the wrong collation. Drop it and create it again with Latin1_General_100_CI_AS_SC_UTF8.', 1;\n"
            "IF (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME()) = 0\n"
            "    THROW 50003, 'READ_COMMITTED_SNAPSHOT is OFF. Locally run the LOCAL_ONLY create file; on Azure it is ON by default.', 1;\n"
            "GO\n\n")
        notes.append('The master section (CREATE DATABASE, ALTER DATABASE) is in the LOCAL_ONLY file before this one;')
        notes.append('  here it is replaced by a check that THROWs if the collation is wrong or RCSI is off.')
        text = text[:header_end] + check + text[i:]
    # every other file / part: connect to the database instead of USE
    text, n = re.subn(r'^USE \w+;\s*\nGO\s*\n', '', text, flags=re.M)
    if n:
        notes.append('USE <database> removed: connect to the database instead (the file checks it).')
    if SYSADMIN_GUARD in text:
        text = text.replace(SYSADMIN_GUARD,
            "IF NOT (IS_ROLEMEMBER('gecko_system') = 1 OR IS_SRVROLEMEMBER('sysadmin') = 1 OR IS_MEMBER('db_owner') = 1)")
        notes.append("The sysadmin guard also accepts db_owner (the Azure server admin is not sysadmin).")
    if LOGIN_CHECK in text:
        text = text.replace(LOGIN_CHECK,
            "IF SERVERPROPERTY('EngineEdition') <> 5   -- Azure SQL cannot see server logins; CREATE USER below fails clearly instead\n"
            "   AND (NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_app')\n"
            "     OR NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_system'))")
        notes.append('The sys.server_principals login check is skipped on Azure SQL (not visible there).')
    if not notes:
        notes.append('None.')
    return text, notes


def wrap(r, body, notes):
    name = file_name(r)
    local_only = r.get('part') == 'local_create'
    tx = not local_only            # CREATE / ALTER DATABASE cannot run inside a transaction
    h = []
    h.append('-- ============================================================')
    h.append('-- REPAIR RUN %03d · %s · database: %s · GENERATED %s — do not edit, edit the source and rebuild'
             % (r['no'], r['phase'], r['db'], datetime.date.today().isoformat()))
    h.append('-- Source: web.mnr.gecko-api\\docs\\database\\%s' % r['src'].replace('/', '\\'))
    h.append('-- Local: run_local.ps1 (or sqlcmd -S localhost -E -d %s -b -i <this file>).' % r['db'])
    h.append('-- Azure: SSMS, connected to %s as the server admin, Query > SQLCMD Mode ON, Execute.' % r['db'])
    if tx:
        h.append('-- All or nothing: one transaction. If anything fails the script stops and everything is rolled back')
        h.append('-- (if SSMS still shows an open transaction, run ROLLBACK).')
    h.append('-- Changes from the source:')
    h += ['--   ' + n for n in notes]
    h.append('-- ============================================================')
    h.append(':on error exit')
    h.append(':setvar TARGETDB "%s"' % r['db'])
    h.append(':setvar RUNMODE "SQLCMD"')
    h.append('GO')
    h.append('SET NOEXEC OFF;')
    h.append('GO')
    h.append("IF N'$(RUNMODE)' <> N'SQLCMD'")
    h.append('BEGIN')
    h.append("    RAISERROR('Turn on SQLCMD Mode (Query menu > SQLCMD Mode) and run again. Nothing was changed.', 16, 1);")
    h.append('    SET NOEXEC ON;')
    h.append('END')
    h.append('GO')
    h.append("IF DB_NAME() <> N'$(TARGETDB)'")
    h.append('BEGIN')
    h.append("    RAISERROR('Wrong database: connect to $(TARGETDB) and run again. Nothing was changed.', 16, 1);")
    h.append('    SET NOEXEC ON;')
    h.append('END')
    h.append('GO')
    if local_only:
        h.append("IF SERVERPROPERTY('EngineEdition') = 5")
        h.append('BEGIN')
        h.append("    PRINT 'Azure SQL: nothing to do in this file. Create the database in the portal (RUN_ORDER.md), then run the next file.';")
        h.append('    SET NOEXEC ON;')
        h.append('END')
        h.append('GO')
    else:
        h.append('SET XACT_ABORT ON;')
        h.append('SET QUOTED_IDENTIFIER ON;')
        h.append('SET ANSI_NULLS ON;')
        h.append('BEGIN TRANSACTION;')
        h.append('GO')
    f = []
    f.append('')
    if tx:
        f.append('IF @@TRANCOUNT = 0')
        f.append("    THROW 50999, 'The transaction was lost part-way: nothing to commit. Check the messages above.', 1;")
        f.append('COMMIT;')
    f.append("PRINT '>> REPAIR RUN %03d (%s) finished.';" % (r['no'], name))
    f.append('GO')
    f.append('SET NOEXEC OFF;')
    f.append('GO')
    return '\n'.join(h) + '\n' + body.rstrip() + '\n' + '\n'.join(f) + '\n'


# ---- build ---------------------------------------------------------------
expected = set()
changed = []
for r in runs:
    name = file_name(r)
    expected.add(name)
    body, notes = transform(r, read_src(r['src']))
    content = wrap(r, body, notes).replace('\n', '\r\n')
    path = os.path.join(OUT, name)
    old = open(path, encoding='utf-8-sig').read() if os.path.exists(path) else None
    # ignore the GENERATED date when comparing
    strip = lambda s: re.sub(r'GENERATED \d{4}-\d\d-\d\d', '', s or '').replace('\r\n', '\n')
    if old is None or strip(old) != strip(content):
        changed.append(name + ('' if old is None else '  (CHANGED)'))
        with open(path, 'w', encoding='utf-8-sig', newline='') as fh:   # BOM: SSMS reads Thai text correctly
            fh.write(content)

# a numbered file in the folder that the manifest no longer produces = someone renumbered
stray = sorted(n for n in os.listdir(OUT) if re.match(r'^\d{3}_.*\.sql$', n) and n not in expected)
if stray:
    print('WARNING: files in the run folder not produced by the manifest (renumbered or removed?):')
    for n in stray:
        print('   ', n)

# ---- RUN_ORDER.md (generated) --------------------------------------------
rows = []
for r in runs:
    note = ''
    if r.get('part') == 'local_create':
        note = 'Azure: **skip** — create `gecko_repair` in the portal instead (below)'
    elif r['db'] == 'gecko_repair' and r['src'].endswith('91_rls_policy.sql'):
        note = 'Re-run (new number) after any script that adds tables'
    elif r['src'].endswith('51_mnr_roles_and_plans.sql'):
        note = 'Review §0 pilot branches before running'
    rows.append('| %03d | %s | %s | `%s` | %s |' % (r['no'], r['phase'], r['db'], file_name(r), note))

run_order = """# Gecko Repair — database run order

GENERATED by `web.mnr.gecko-api/docs/database/_build/build_run_folder.py` from `run_manifest.json`.
Do not edit the `.sql` files here: edit the source script and rebuild.

Run every file **once, in number order**: first on the local SQL Server, later the same files on Azure SQL.
Record each run in `RUN_LOG.md` (run_local.ps1 does it for local runs).

## Local
```powershell
cd D:\\SHARMA\\PROJECT\\gecko\\database\\REPAIR_RUN
.\\run_local.ps1                 # all files not yet logged as OK locally
.\\run_local.ps1 -From 5 -To 7   # a range
.\\run_local.ps1 -WhatIf         # list only
```

## Azure SQL (`gecko-platform-sql`)
1. SSMS, connect as the **server admin** to the database named in the file name.
2. **Query > SQLCMD Mode** ON (the file refuses to run otherwise). Execute.
3. Each file is one transaction: all or nothing. If one fails, stop and send the message; if SSMS shows an open transaction, run `ROLLBACK`.
4. Connected to the wrong database = refused before anything runs.

### Before the first gecko_repair file: create gecko_repair in the portal
| Setting | Value |
|---|---|
| Server | **gecko-platform-sql** |
| Database name | **gecko_repair** |
| Compute + storage | **Standard S0** or higher (not Basic: 2 GB cap) |
| Data source | None (blank) |
| Collation (Additional settings) | **Latin1_General_100_CI_AS_SC_UTF8** (cannot be changed later) |

Do not create users: the gecko_repair security file creates `gecko_app_user` / `gecko_system_user` for the existing logins.

## Files
| No | Phase | Database | File | Note |
|---|---|---|---|---|
%s

## Rules
* Numbers are append-only. Once a file has run anywhere it is never renumbered or removed.
* Once a file has run **on Azure** it is frozen: a fix is a new file with the next number.
* Before Azure, sources may still be fixed and the folder rebuilt; re-run the changed files locally.
""" % '\n'.join(rows)
open(os.path.join(OUT, 'RUN_ORDER.md'), 'w', encoding='utf-8', newline='\n').write(run_order)

log = os.path.join(OUT, 'RUN_LOG.md')
if not os.path.exists(log):
    open(log, 'w', encoding='utf-8', newline='\n').write(
        '# Gecko Repair — run log\n\nOne line per run. Local lines are written by run_local.ps1; add Azure lines by hand (or ask Claude).\n\n'
        '| When | Where | File | Result |\n|---|---|---|---|\n')

import shutil
shutil.copyfile(os.path.join(HERE, 'run_local.ps1'), os.path.join(OUT, 'run_local.ps1'))   # source of the runner lives here

print('Run folder:', OUT)
print('Written/changed:' if changed else 'No changes.')
for c in changed:
    print('   ', c)
