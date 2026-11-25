-- ============================================================
-- GECKO MASTER DATA — REPAIR (M&R) CODE LISTS (P1)
-- Script: 80_repair_code_lists.sql
--
-- Vocabulary the Repair module validates against (owning module MNR). Already
-- seeded by 12: SURVEY_TYPE, REPAIR_MODE, REPAIR_GROUP, COMPONENT_GROUP,
-- REEFER_UNIT_MAKE. Added here:
--   REPAIR_TRADE                 labour cost rate trade / technician skill (gecko_repair config.labor_cost_rate)
--   UNIT_TEST_TYPE            periodic tests and certificates (unit.unit_test)
--   CLASS_SOCIETY             who inspected / certified (unit.unit_test, modifications)
--   CLEANING_TYPE             cleaning job kinds (P9)
--   CLEANING_BAY_CAPABILITY   what a cleaning bay can do (P9)
--   MATERIAL_CATEGORY         parts / materials grouping (P6)
--   MODIFICATION_TYPE         container modifications (P10)
--   INCIDENT_TYPE             emergencies and incidents (P10)
-- All of them now, so the vocabulary is reviewed once and phases do not keep
-- touching gecko_master.
--
-- OPEN lists (allows_tenant_values = 1): a depot or contractor may add its own
-- values as tenant rows in config.code_list_value; the global starting set is
-- what any depot in the region recognises. UNIT_TEST_TYPE is closed: test
-- regimes are regulated (ISO / IMO / CSC / ATP), not a tenant choice.
-- Descriptions are English; the local-language labels come with the i18n packs (G7).
--
-- Idempotent. Safe to re-run. Run as sysadmin (lookup.* is read-only to both
-- application logins).
-- ============================================================

USE gecko_master;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET NOCOUNT ON;
GO

IF NOT (IS_SRVROLEMEMBER('sysadmin') = 1)
BEGIN
    RAISERROR('Run as sysadmin. lookup.* is read-only for both application logins.', 16, 1);
    SET NOEXEC ON;
END
GO

IF NOT EXISTS (SELECT 1 FROM lookup.module WHERE module_code = 'MNR' AND is_active = 1)
    THROW 50690, 'MNR is not in lookup.module — run 13_module_vocabulary.sql first.', 1;
GO

MERGE lookup.code_list_category AS t
USING (VALUES
    ('REPAIR_TRADE',               N'M&R workshop trade of a technician / labour cost rate (welder, painter, reefer technician ...)', 'MNR', 1, NULL),
    ('UNIT_TEST_TYPE',          N'Periodic test or certificate of a container (tank 2.5 / 5 year, CSC, ATP ...)',                  'MNR', 0, NULL),
    ('CLASS_SOCIETY',           N'Classification society or approved inspection body',                                             'MNR', 1, NULL),
    ('CLEANING_TYPE',           N'Kind of container cleaning job',                                                                 'MNR', 1, NULL),
    ('CLEANING_BAY_CAPABILITY', N'What a cleaning bay is equipped to do',                                                          'MNR', 1, NULL),
    ('MATERIAL_CATEGORY',       N'Group of M&R materials and parts',                                                               'MNR', 1, NULL),
    ('MODIFICATION_TYPE',       N'Kind of container modification',                                                                 'MNR', 1, NULL),
    ('INCIDENT_TYPE',           N'Kind of M&R emergency or incident',                                                              'MNR', 1, NULL)
) AS s (category_code, description_en, owning_module, allows_tenant_values, legacy_vector_category)
   ON t.category_code = s.category_code
WHEN MATCHED THEN UPDATE SET
    description_en = s.description_en, owning_module = s.owning_module,
    allows_tenant_values = s.allows_tenant_values, legacy_vector_category = s.legacy_vector_category, is_active = 1
WHEN NOT MATCHED THEN
    INSERT (category_code, description_en, owning_module, allows_tenant_values, legacy_vector_category)
    VALUES (s.category_code, s.description_en, s.owning_module, s.allows_tenant_values, s.legacy_vector_category);
PRINT CONCAT('>> Repair code list categories merged: ', @@ROWCOUNT);
GO

MERGE lookup.code_list_value AS t
USING (VALUES
    ('REPAIR_TRADE', 'WELDER',            N'Welder / steel repairer',                 NULL, 10),
    ('REPAIR_TRADE', 'PAINTER',           N'Painter / blaster',                       NULL, 20),
    ('REPAIR_TRADE', 'CARPENTER',         N'Floor and timber repairer',               NULL, 30),
    ('REPAIR_TRADE', 'REEFER_TECH',       N'Reefer technician',                       NULL, 40),
    ('REPAIR_TRADE', 'TANK_TECH',         N'Tank technician (valves, fittings, tests)', NULL, 50),
    ('REPAIR_TRADE', 'CLEANER',           N'Cleaner / washer',                        NULL, 60),
    ('REPAIR_TRADE', 'GENERAL',           N'General repairer / helper',               NULL, 70),
    ('REPAIR_TRADE', 'SURVEYOR',          N'Surveyor / inspector',                    NULL, 80),

    ('UNIT_TEST_TYPE', 'TANK_2_5Y',    N'Tank intermediate test (2.5 year)',       NULL, 10),
    ('UNIT_TEST_TYPE', 'TANK_5Y',      N'Tank periodic test (5 year, hydraulic)',  NULL, 20),
    ('UNIT_TEST_TYPE', 'TANK_EXCEPTIONAL', N'Tank exceptional inspection',         NULL, 30),
    ('UNIT_TEST_TYPE', 'CSC_PERIODIC', N'CSC periodic examination',                NULL, 40),
    ('UNIT_TEST_TYPE', 'CSC_ACEP',     N'CSC ACEP examination',                    NULL, 50),
    ('UNIT_TEST_TYPE', 'ATP',          N'ATP certificate (perishable transport)',  NULL, 60),
    ('UNIT_TEST_TYPE', 'PRESSURE',     N'Pressure / leak test',                    NULL, 70),
    ('UNIT_TEST_TYPE', 'REEFER_ANNUAL',N'Reefer annual inspection',                NULL, 80),

    ('CLASS_SOCIETY', 'ABS',           N'American Bureau of Shipping',             NULL, 10),
    ('CLASS_SOCIETY', 'BV',            N'Bureau Veritas',                          NULL, 20),
    ('CLASS_SOCIETY', 'DNV',           N'DNV',                                     NULL, 30),
    ('CLASS_SOCIETY', 'LR',            N'Lloyd''s Register',                       NULL, 40),
    ('CLASS_SOCIETY', 'CCS',           N'China Classification Society',            NULL, 50),
    ('CLASS_SOCIETY', 'NK',            N'ClassNK',                                 NULL, 60),
    ('CLASS_SOCIETY', 'KR',            N'Korean Register',                         NULL, 70),
    ('CLASS_SOCIETY', 'RINA',          N'RINA',                                    NULL, 80),

    ('CLEANING_TYPE', 'SWEEP',         N'Sweep',                                   NULL, 10),
    ('CLEANING_TYPE', 'WATER_WASH',    N'Water wash',                              NULL, 20),
    ('CLEANING_TYPE', 'DETERGENT_WASH',N'Detergent wash',                          NULL, 30),
    ('CLEANING_TYPE', 'STEAM',         N'Steam clean',                             NULL, 40),
    ('CLEANING_TYPE', 'CHEMICAL',      N'Chemical clean (residue specific)',       NULL, 50),
    ('CLEANING_TYPE', 'DEODORISE',     N'Deodorise',                               NULL, 60),
    ('CLEANING_TYPE', 'FUMIGATION',    N'Fumigation',                              NULL, 70),
    ('CLEANING_TYPE', 'LABEL_REMOVAL', N'Label / placard removal',                 NULL, 80),
    ('CLEANING_TYPE', 'TANK_CLEAN',    N'Tank interior clean (with certificate)',  NULL, 90),

    ('CLEANING_BAY_CAPABILITY', 'WATER',    N'Water wash',                         NULL, 10),
    ('CLEANING_BAY_CAPABILITY', 'STEAM',    N'Steam',                              NULL, 20),
    ('CLEANING_BAY_CAPABILITY', 'CHEMICAL', N'Chemical / detergent dosing',        NULL, 30),
    ('CLEANING_BAY_CAPABILITY', 'TANK',     N'Tank washing heads',                 NULL, 40),
    ('CLEANING_BAY_CAPABILITY', 'REEFER',   N'Reefer power point',                 NULL, 50),

    ('MATERIAL_CATEGORY', 'STEEL',     N'Steel sheet, profiles and sections',      NULL, 10),
    ('MATERIAL_CATEGORY', 'FLOORING',  N'Flooring (plywood, bamboo, steel)',       NULL, 20),
    ('MATERIAL_CATEGORY', 'PAINT',     N'Paint, primer and coating',               NULL, 30),
    ('MATERIAL_CATEGORY', 'SEALANT',   N'Sealant and adhesive',                    NULL, 40),
    ('MATERIAL_CATEGORY', 'DOOR_GEAR', N'Door gear, gaskets and hinges',           NULL, 50),
    ('MATERIAL_CATEGORY', 'FASTENER',  N'Fasteners and rivets',                    NULL, 60),
    ('MATERIAL_CATEGORY', 'REEFER_PART', N'Reefer parts and refrigerant',          NULL, 70),
    ('MATERIAL_CATEGORY', 'TANK_PART', N'Tank valves, gaskets and fittings',       NULL, 80),
    ('MATERIAL_CATEGORY', 'CHEMICAL',  N'Cleaning chemicals',                      NULL, 90),
    ('MATERIAL_CATEGORY', 'CONSUMABLE',N'Welding wire, gas, abrasives, consumables', NULL, 100),

    ('MODIFICATION_TYPE', 'VENT',      N'Add or change ventilation',               NULL, 10),
    ('MODIFICATION_TYPE', 'DOOR',      N'Add or change a door (side / end)',       NULL, 20),
    ('MODIFICATION_TYPE', 'LINING',    N'Interior lining / insulation',            NULL, 30),
    ('MODIFICATION_TYPE', 'FLOOR',     N'Floor change',                            NULL, 40),
    ('MODIFICATION_TYPE', 'MARKING',   N'Re-marking / livery / CSC plate',         NULL, 50),
    ('MODIFICATION_TYPE', 'CONVERSION',N'Conversion (office, storage, special)',   NULL, 60),

    ('INCIDENT_TYPE', 'LEAK',          N'Leak or spill',                           NULL, 10),
    ('INCIDENT_TYPE', 'FIRE',          N'Fire or overheating',                     NULL, 20),
    ('INCIDENT_TYPE', 'REEFER_ALARM',  N'Reefer alarm / temperature excursion',    NULL, 30),
    ('INCIDENT_TYPE', 'HANDLING_DAMAGE', N'Damage caused by handling in the depot',NULL, 40),
    ('INCIDENT_TYPE', 'STRUCTURAL',    N'Structural failure',                      NULL, 50),
    ('INCIDENT_TYPE', 'DG_RESIDUE',    N'Dangerous goods residue found',           NULL, 60),
    ('INCIDENT_TYPE', 'PEST',          N'Pest / contamination',                    NULL, 70)
) AS s (category_code, code, description_en, iso_code, sort_order)
   ON t.category_code = s.category_code AND t.code = s.code
WHEN MATCHED THEN UPDATE SET
    description_en = s.description_en, iso_code = s.iso_code, sort_order = s.sort_order, is_active = 1
WHEN NOT MATCHED THEN
    INSERT (category_code, code, description_en, iso_code, sort_order)
    VALUES (s.category_code, s.code, s.description_en, s.iso_code, s.sort_order);
PRINT CONCAT('>> Repair code list values merged: ', @@ROWCOUNT);
GO

SELECT c.category_code, c.allows_tenant_values, COUNT(v.code) AS global_values
FROM lookup.code_list_category c
LEFT JOIN lookup.code_list_value v ON v.category_code = c.category_code
WHERE c.owning_module = 'MNR'
GROUP BY c.category_code, c.allows_tenant_values
ORDER BY c.category_code;
GO

EXEC dbo.usp_record_script '80_repair_code_lists.sql', N'Repair P1: code lists (owning module MNR) REPAIR_TRADE, UNIT_TEST_TYPE, CLASS_SOCIETY, CLEANING_TYPE, CLEANING_BAY_CAPABILITY, MATERIAL_CATEGORY, MODIFICATION_TYPE, INCIDENT_TYPE + global starting values';
GO

PRINT '>> 80_repair_code_lists.sql completed.';
GO
