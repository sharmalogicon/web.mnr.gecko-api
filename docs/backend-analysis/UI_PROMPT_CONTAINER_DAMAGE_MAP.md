# UI prompt — Container Damage Map (2D + 3D)

Paste everything below the line into a web.mnr.gecko-api session.
Design references: `01_Gecko_Repair_Business_Modules.docx` §18 (R15) and `02_Gecko_Repair_Database_Design.docx` §4.3 / §4.10 (`code.container_model`, `code.model_face`, `code.face_zone`, `doc.damage_mark`).

---

**Task:** build a shared **container damage map**. A surveyor, estimator, approver or technician uses it to see, add, move, resize and delete damage and inspection marks on a picture of the container. There are two views that always show the same marks:

- **2D:** the container's faces laid out flat (unfolded).
- **3D:** the box itself, which the user can rotate and zoom.

Use it on the survey, estimate (repair) and work-order pages. The back end is not built yet, so run on seed data through the repository layer, exactly like the other entities. The API shapes below are the contract the Repair API will serve later.

**Why:** product owner decision Q15 (25 Nov 2026). Damage must be marked on an image of the container, in 2D and 3D, on view, edit and add pages. Owners (lessors, local liners) approve from the PDF, which prints the 2D view with numbered marks. The phase-2 mobile app will reuse the same mark format.

## 0. Rules that override everything (CLAUDE.md)

- **No `style={{…}}`** anywhere, and no `element.style.*` mutation.
  - Size the 3D `<Canvas>` with a CSS-module class on its wrapper.
  - Set SVG geometry through SVG **attributes** (`x`, `y`, `width`, `height`, `points`, `transform`). Attributes are not inline style.
  - Make every other dynamic value a `data-*` attribute or a class toggle.
- **No hex, rgb or hsl literals** in JSX or CSS modules, and no Tailwind typography or colour classes.
  - SVG fills and strokes come from CSS-module classes that use `var(--gecko-…)` tokens.
  - three.js materials need colour values. Read them at runtime from the gecko CSS variables: `getComputedStyle(document.documentElement).getPropertyValue('--gecko-danger-500')`, through one helper `useGeckoColor(token)`. Never write a literal.
- The page chrome stays in the existing shells (`FormPageShell`, `DetailPageShell`, `EditPageShell`). The map is content inside a `gecko-card` / `gecko-card-body`.
- Toolbar buttons are `gecko-btn gecko-btn-sm`; pills are `gecko-pill …`.
- Icons come from `@/components/ui/Icon`.
- If a style pattern repeats, add a utility to `src/app/gecko_design_system_components.css`. Otherwise co-locate a `*.module.css`.
- `npx tsc --noEmit`, `npm test` and `npm run guard` must stay green. Brand name is GECKO.

## 1. Dependencies

Add the same 3D stack the Fleet UI uses. Its axle map is `web.fleet.gecko-api/src/components/tire-axle-map/AxleDiagram3D.tsx`; read it first, because it solves orbit, picking, `Html` labels and SSR.

```
three@^0.187.0  @react-three/fiber@^9.8.2  @react-three/drei@^10.7.9  (+ @types/three as dev)
```

- Load the 3D view with `next/dynamic(() => import(...), { ssr: false })`, as `TireAxleMapClient.tsx` does.
- 2D is the default view and the only one used for print. 3D is lazy-loaded when the user switches to it.

## 2. Data contract (types)

Put the types in `src/lib/types/damage-map.ts`. They mirror the planned API (`GET /api/repair/container-models?isoCode=`, and the `marks` collections on surveys, estimates and work orders).

```ts
export type FaceCode = 'LEFT' | 'RIGHT' | 'FRONT' | 'DOOR' | 'ROOF' | 'FLOOR' | 'UNDER' | 'INTERIOR' | 'MACHINERY';
export type MarkShape = 'POINT' | 'RECT' | 'POLYGON';
export type MarkOwnerType = 'SURVEY_DAMAGE' | 'SURVEY_ITEM' | 'ESTIMATE_LINE' | 'WO_TASK';
export type MarkState = 'NEW' | 'PRE_EXISTING' | 'APPROVED' | 'REJECTED' | 'REPAIRED';

export interface ContainerModel {
  modelCode: string;            // '20DV', '40HC', '40RF', '20TK', '40FR' …
  version: number;
  equipmentCategory: 'DRY' | 'REEFER' | 'TANK' | 'FLAT' | 'OPEN_TOP' | 'BULK';
  lengthMm: number; widthMm: number; heightMm: number;
  modelKind: 'DETAILED_PROCEDURAL' | 'GLTF'; // P1: DETAILED_PROCEDURAL for every type
  detailSpec: DetailSpec;       // drives the procedural builder (below)
  assetUri?: string;            // optional glTF override per type
  faces: ModelFace[];
}

export interface ModelFace {
  faceCode: FaceCode;
  widthMm: number; heightMm: number;
  // 2D unfolded layout: cell in a layout grid, in mm (so faces keep true proportions)
  layoutX: number; layoutY: number; layoutRotationDeg: 0 | 90 | 180 | 270;
  // 3D placement: a face-local (x, y) in 0–1 maps to origin + x*u + y*v (model mm, box centred at 0,0,0)
  origin3d: [number, number, number]; u3d: [number, number, number]; v3d: [number, number, number];
  normal3d: [number, number, number];   // outward normal
  gridCols: number; gridRows: number;
  zones: FaceZone[];
}

export interface DetailSpec {
  corrugation: { pitchMm: number; depthMm: number; sides: boolean; front: boolean; roof: boolean } | null;
  cornerPosts: boolean; cornerCastings: boolean; topRails: boolean; bottomRails: boolean;
  crossMembers: boolean; forkliftPockets: boolean; gooseneckTunnel: boolean;
  doors: { leaves: 2; lockingBarsPerLeaf: number; hinges: number } | null;
  reeferUnit: { depthMm: number } | null;                       // machinery end at FRONT
  tank: { barrelDiameterMm: number; barrelLengthMm: number; manlid: boolean; topValve: boolean; bottomValve: boolean; walkway: boolean } | null;
  flatRackEnds: { foldable: boolean } | null;
  openTop: { bows: number; tarpaulin: boolean } | null;
}

export interface FaceZone {
  x0: number; y0: number; x1: number; y1: number; // normalised 0–1 on the face
  locationCode: string;   // CEDEX location code the zone maps to (from the API — never hard-coded in components)
  labelKey: string;       // i18n key
}

export interface DamageMark {
  id: string;                    // uuid (client-generated for new marks: also the offline client_ref)
  ownerType: MarkOwnerType; ownerId: string;   // the line / item / task it belongs to
  modelCode: string; modelVersion: number;
  faceCode: FaceCode;
  shape: MarkShape;
  x: number; y: number;          // 0–1, origin = top-left of the face as drawn in the 2D view
  width?: number; height?: number;               // RECT (0–1)
  points?: [number, number][];   // POLYGON (0–1)
  isInterior: boolean;
  derivedLocationCode?: string;  // zone at the mark centre (server recomputes)
  labelNo: number;               // = line number shown on the map and in the grid
  state: MarkState;
  sourceMarkId?: string;         // copied from (gate → survey → estimate → task)
  inputMode: '2D' | '3D';
  photoIds?: string[];
}
```

**3D positions are never stored.** A face point is `origin + x·u + y·v`. A 3D click is converted back to `(face, x, y)` by projecting the hit point onto the face's `u`/`v`. Write these as pure functions in `src/lib/damage-map/geometry.ts`, with Vitest tests: round-trip 2D → 3D → 2D within 1e-6, clamping to 0–1, and zone lookup.

## 3. Seed data and repository (until the API exists)

- **Models:** `src/data/seed/_shared/container-models.ts` holds a **detailed model per container type** (product owner decision Q19 — not a plain box) for 20DV, 40DV, 40HC, 45HC, 20RF/40RF (with a MACHINERY face at the front end), 20TK (a frame with a cylinder barrel inside; marks go on the frame faces and on a BARREL pseudo-face), 40FR and 20OT. Each carries a `detailSpec`.
  - Dimensions follow ISO 668 external sizes (20 ft 6058 × 2438 × 2591 mm; 40 ft 12192 mm; HC height 2896 mm; 45 ft 13716 mm).
  - Zones: split each side into the column sections and height bands of the location grid. Map each zone to a location code from `src/data/seed/_shared/cedex.ts` (stub codes today), and comment that the real codes come from the API code library.
- **Model choice:** `modelForIsoType(isoSizeType)` in `src/lib/damage-map/models.ts`. It uses the 2nd ISO character for height and the type group for category, and falls back to a 20DV/40DV generic model with a warning pill.
- **Repository:** `src/lib/repos/damage-map.ts` with `ContainerModelRepo { list(); byCode(code); forIsoType(iso) }` and `DamageMarkRepo { listFor(ownerType, ownerIds[]); saveFor(ownerType, ownerId, marks[]) }`. Use an in-memory implementation and wire it in `src/lib/repos/index.ts`, following the existing repo pattern.
  - Make these two interfaces **async** (`Promise`), because the data layer is moving to async (doc 03 §3.4).
- Add seed marks to 2–3 existing repair jobs and surveys so the view pages show something.

## 4. Components (`src/components/damage-map/`)

| File | Responsibility |
|---|---|
| `ContainerDamageMap.tsx` | The public component. Props: `model`, `marks`, `mode: 'view' \| 'add' \| 'edit'`, `selectedMarkId`, `onSelect(id)`, `onChange(marks)`, `onCreate(draft)`, `view: '2d' \| '3d'` (controlled, default `'2d'`), `showInterior`, `stateFilter`, `readOnlyReason?`. Renders the toolbar plus `DamageMap2D` or the lazy `DamageMap3D`. |
| `DamageMap2D.tsx` | An SVG of the unfolded faces from `layoutX/Y/rotation`, with true proportions via a `viewBox` in mm. Face outlines, a faint zone grid with zone labels on hover, and the marks (point = numbered circle, rect, polygon). Includes an exterior/interior toggle. |
| `ContainerModel3D.tsx` + `src/lib/damage-map/builders/*.ts` | **Procedural detailed builders**, one per family (dry, reefer, tank, flat rack, open top), producing three.js geometry from exact ISO dimensions and `detailSpec`.<br>- **Dry:** trapezoidal corrugated side, end and roof panels; corner posts; ISO corner castings with apertures; top and bottom side rails; front sill and header; cross-members and forklift pockets underneath; door leaves with 4 locking bars (keepers, cams, handles) and hinges; door header and sill.<br>- **Reefer:** smooth or ribbed walls plus a recessed machinery unit (condenser grille, control box) at the FRONT.<br>- **Tank:** ISO frame (posts, rails, diagonal braces) holding a cylindrical barrel with dished ends, manlid, walkway, top and bottom valves.<br>- **Flat rack:** end walls on a floor base.<br>- **Open top:** roof bows and an optional tarpaulin.<br>Use `InstancedMesh` for repeated parts (corrugations, bars, cross-members), merge static geometry, and keep two levels of detail (full when close, simplified when zoomed out). Materials take colours via `useGeckoColor`. **The face panels used for picking are separate, invisible-to-the-eye but raycastable planes aligned with the face definitions**, so the detail never breaks the (face, x, y) mapping. A glTF loader (`useGLTF`) is used only when `modelKind === 'GLTF'`. |
| `DamageMap3D.tsx` | A react-three-fiber `Canvas` rendering `ContainerModel3D`, `OrbitControls`, `ContactShadows`, and preset camera buttons (front, door, left, right, roof, iso). Marks are decals or flat discs on the face planes, offset along the normal, with drei `Html` number tags (className only). Raycast a click → face + (x, y) → `onCreate` / `onSelect`. |
| `MarkToolbar.tsx` | 2D/3D switch, a tool picker (select, point, rectangle, polygon), the interior toggle, a state filter, "fit" and "reset view", and a legend. Every button is `gecko-btn gecko-btn-sm`. |
| `MarkList.tsx` | An optional compact list (number, face, location code, state) for keyboard and screen-reader users. Selecting in the list selects on the map. |
| `DamageMap.module.css` | Canvas wrapper size, SVG classes per face, zone and mark state (`.markNew`, `.markPreExisting`, `.markApproved`, `.markRejected`, `.markRepaired`, `.markSelected`) using `var(--gecko-…)` tokens only. |
| `useGeckoColor.ts` | Reads CSS variables for three.js materials, and re-reads them when the theme changes. |

### Interaction

**`view` mode**
- Hover shows a tooltip: number, face, location code and description.
- Clicking a mark calls `onSelect`. The parent highlights the matching line in its grid, and the reverse also works.

**`add` mode**
- Pick a tool, then click (point), drag (rect) or click points with a double-click to finish (polygon), on a face in 2D or 3D.
- This creates a **draft mark** and calls `onCreate({ faceCode, x, y, …, derivedLocationCode })`.
- The parent opens or creates the matching line (survey damage line or estimate line), pre-filling the location code from the zone. The user can still change it.

**`edit` mode**
- Drag to move, use handles to resize, `Delete` to remove, and `Esc` to cancel a draft.
- Moving a mark into another zone updates `derivedLocationCode` and asks the parent whether to update the line's location code. Use a small confirm, not a silent change.

**Keyboard**
- Tab cycles through marks; arrow keys nudge the selected mark by 1% of the face (Shift = 5%); Enter selects.
- Every mark has an `aria-label` like "Mark 3, left side, location 8300, approved".

**Both views stay in sync** because they share one `marks` array. Switching views keeps the selection.

**Read-only cases**
- An approved estimate revision, a completed survey, or a user without permission shows `view` mode with `readOnlyReason` as a `gecko-pill gecko-pill-neutral`.

## 5. Where it goes (pages)

| Page | Mode | Owner type | Notes |
|---|---|---|---|
| `/survey/new` | add / edit | `SURVEY_DAMAGE`, `SURVEY_ITEM` | Above the checklist. Placing a mark adds a damage line. Checklist items with a FAIL result can be marked, defaulting to the item's face. The photo-angle placeholders remain. |
| `/survey/[id]` | view | same | Replaces the hard-coded photo/damage block with the map + `MarkList`. |
| `/repair/new` | add / edit | `ESTIMATE_LINE` | Sits beside the line `useFieldArray`. A mark creates or selects a line; deleting a line deletes its marks; `labelNo` = line number. Marks copied from the survey arrive with `sourceMarkId` and state `NEW`. |
| `/repair/[id]` | view (edit while status `estimated`) | `ESTIMATE_LINE` | Colours follow line approval (approved / rejected). Replaces the hard-coded damage description section. |
| `/equipment/[id]` | view | latest case | Read-only, "last known damage". |
| Work orders (when built) | view + mark repaired | `WO_TASK` | Completing a task sets its marks to `REPAIRED`. A before/after toggle shows the source marks next to the repaired ones. |

Print (`@media print`): the 2D SVG prints with numbered marks and a legend, and the 3D view is hidden. Use the existing `gecko_design_system_print.css`.

## 6. States (`?loading=1`, `?error=1`, `?empty=1`)

Follow the existing test-only URL parameters:
- **Loading:** skeleton over the map area.
- **Error:** inline `gecko-card` with retry.
- **No model for the ISO type:** generic model plus a warning pill.
- **No marks:** in view mode, the empty map shows "No damage marked". In add mode it shows a short hint.

## 7. Tests (Vitest)

- `geometry.test.ts`
  - 2D↔3D round trip on every face of every seed model.
  - Clamping.
  - Zone lookup at zone edges, where the lower zone wins.
  - `modelForIsoType` for 22G1, 42G1, 45G1, 22R1, 45R1, 22T1 and an unknown code.
- `builders.test.ts`
  - Each builder's bounding box equals the model's external dimensions (±1 mm).
  - Every face's picking plane matches `origin3d`/`u3d`/`v3d`.
  - The instanced corrugation count follows `pitchMm`.
  - A dry 40HC scene stays under a triangle budget (e.g. 150k at full detail, 30k at low detail).
- `ContainerDamageMap.test.tsx` (Testing Library, 2D only, with 3D mocked)
  - Add a point mark → `onCreate` receives the face, x/y and location code.
  - Select from the list → the map selection changes.
  - Delete in edit mode removes the mark.
  - View mode does not create marks.
- Design guard: no new `style={{` and no colour literals (`npm run guard`).

## 8. Out of scope (do not build now)

- Real API calls (the repos stay in-memory until the Repair API exists).
- Buying or commissioning glTF assets (the loader path exists; procedural detailed models are the default — doc 03 Q21).
- Photo annotation inside photos.
- Offline/mobile behaviour.
- EDI.
- Server-side PDF rendering (the browser print layout is enough for now).

## 9. Done when

- The map renders every seed model in 2D and as a **detailed per-type 3D model** (corrugated walls, rails, castings, door gear, reefer unit, tank barrel and frame). The 3D view orbits and zooms and picks the right face. Marks stay in step between the views and with the line grids on survey and repair pages.
- Add, edit and view modes behave as in §4 on `/survey/new`, `/survey/[id]`, `/repair/new` and `/repair/[id]`, with keyboard access.
- Print shows the 2D map with numbered marks.
- `npx tsc --noEmit`, `npm test` and `npm run guard` are green. There are no inline styles, no colour literals, and the brand-name check of CLAUDE.md §5 passes.
