/**
 * Shared seed: tariff container-mode catalogue.
 * Phase 7.7 D-17.
 *
 * The container variant a charge applies to. Inherited from TOS depot-ops
 * convention.
 */

export interface ContainerMode {
  code: string;
  label: string;
}

export const containerModes: ContainerMode[] = [
  { code: 'STL', label: 'Steel — standard dry box' },
  { code: 'REF', label: 'Reefer — refrigerated' },
  { code: 'OOG', label: 'Out-of-gauge / oversized' },
  { code: 'BB',  label: 'Break-bulk / flat-rack' },
  { code: 'GP',  label: 'General purpose' },
  { code: 'HC',  label: 'High cube' },
];

export function findContainerMode(code: string): ContainerMode | undefined {
  return containerModes.find((m) => m.code === code);
}
