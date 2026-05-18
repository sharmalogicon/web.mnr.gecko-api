/**
 * Shared seed: Survey checklists per equipment type.
 * Phase 5 (DRY 25 + TANK 20) + Phase 6 (REEFER 30 + PTI 25).
 *
 * PLAUSIBLE STUBS matching industry conventions — not lifted from a single
 * published standard. Phase 5 D-02 / Phase 6 D-04 document this residual.
 *
 * Items flagged `measurementCm: true` are dimension-bearing on off-hire
 * surveys — the form renders a numeric input that drives the IICL-6 verdict
 * from `src/lib/cedex/iicl6.ts` (SURV-06).
 */

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  /** If true, the surveyor records a numeric damage dimension (cm). */
  measurementCm?: boolean;
  /** Optional CEDEX component code for IICL-6 verdict lookup. */
  cedexComponent?: string;
}

// ============================================================================
// DRY (25 items) + 6 photo angles per SURV-01
// ============================================================================
export const dryChecklist: ChecklistItem[] = [
  // External (8)
  { id: 'd-ext-1',  category: 'External', label: 'Roof panel condition (no major dents)',                measurementCm: true, cedexComponent: 'FNX' },
  { id: 'd-ext-2',  category: 'External', label: 'Side wall integrity (left side)',                       measurementCm: true, cedexComponent: 'SDR' },
  { id: 'd-ext-3',  category: 'External', label: 'Side wall integrity (right side)',                      measurementCm: true, cedexComponent: 'SDR' },
  { id: 'd-ext-4',  category: 'External', label: 'Front-end panel condition',                             measurementCm: true, cedexComponent: 'FNX' },
  { id: 'd-ext-5',  category: 'External', label: 'Underframe + cross-members visual',                                              },
  { id: 'd-ext-6',  category: 'External', label: 'Corner castings — all 8 (no cracks)',                   measurementCm: true, cedexComponent: 'CCS' },
  { id: 'd-ext-7',  category: 'External', label: 'Fork pockets clear (none for 40\')',                                              },
  { id: 'd-ext-8',  category: 'External', label: 'External paint + markings legible',                                               },
  // Doors (5)
  { id: 'd-dor-1',  category: 'Doors',    label: 'Door header / top rail',                                measurementCm: true, cedexComponent: 'DRH' },
  { id: 'd-dor-2',  category: 'Doors',    label: 'Door bottom sill',                                                                },
  { id: 'd-dor-3',  category: 'Doors',    label: 'Hinges + tie-down lugs',                                                          },
  { id: 'd-dor-4',  category: 'Doors',    label: 'Cam lock assemblies (4 rods)',                                                    },
  { id: 'd-dor-5',  category: 'Doors',    label: 'Door gasket / seal continuity',                                cedexComponent: 'GAS'  },
  // Interior (5)
  { id: 'd-int-1',  category: 'Interior', label: 'Interior cleanliness',                                                            },
  { id: 'd-int-2',  category: 'Interior', label: 'Interior lining condition',                                                       },
  { id: 'd-int-3',  category: 'Interior', label: 'No odor / contamination',                                                         },
  { id: 'd-int-4',  category: 'Interior', label: 'Lashing rings + d-rings present',                                                 },
  { id: 'd-int-5',  category: 'Interior', label: 'Roof seam tightness (light-test)',                                                },
  // Floor (3)
  { id: 'd-flr-1',  category: 'Floor',    label: 'Floor plank condition',                                 measurementCm: true, cedexComponent: 'FLR' },
  { id: 'd-flr-2',  category: 'Floor',    label: 'Floor cleanliness (no debris/oil)',                                               },
  { id: 'd-flr-3',  category: 'Floor',    label: 'Front-end inner panel integrity',                                                 },
  // Markings + plates (4)
  { id: 'd-plt-1',  category: 'Plates',   label: 'CSC plate present + legible',                                                     },
  { id: 'd-plt-2',  category: 'Plates',   label: 'ACEP plate matches register',                                                     },
  { id: 'd-plt-3',  category: 'Plates',   label: 'Owner code + serial match',                                                       },
  { id: 'd-plt-4',  category: 'Plates',   label: 'BIC ID stencil clarity',                                                          },
];

export const dryPhotoAngles: string[] = [
  'Door end (closed)',
  'Door open (interior)',
  'Front end (closed end)',
  'Left side wall',
  'Right side wall',
  'Roof + floor (combined)',
];

// ============================================================================
// TANK (20 items) — pressure / vacuum / valve focus per SURV-02
// ============================================================================
export const tankChecklist: ChecklistItem[] = [
  // External shell (4)
  { id: 't-shl-1',  category: 'Shell',       label: 'Shell external condition (no dents)',                measurementCm: true, cedexComponent: 'SHL' },
  { id: 't-shl-2',  category: 'Shell',       label: 'Insulation + cladding integrity',                                                                },
  { id: 't-shl-3',  category: 'Shell',       label: 'Frame + walkway condition',                                                                       },
  { id: 't-shl-4',  category: 'Shell',       label: 'Data plate + IMO markings',                                                                       },
  // Valves (5)
  { id: 't-vlv-1',  category: 'Valves',      label: 'Top discharge valve operation',                                                                   },
  { id: 't-vlv-2',  category: 'Valves',      label: 'Bottom discharge valve operation',                                                                },
  { id: 't-vlv-3',  category: 'Valves',      label: 'Pressure relief valve set point',                                                                 },
  { id: 't-vlv-4',  category: 'Valves',      label: 'Manhole gasket + cover seal',                                                                     },
  { id: 't-vlv-5',  category: 'Valves',      label: 'Vapor / liquid line connections',                                                                 },
  // Internal lining (3)
  { id: 't-lin-1',  category: 'Lining',      label: 'Interior lining continuity',                          measurementCm: true, cedexComponent: 'LIN' },
  { id: 't-lin-2',  category: 'Lining',      label: 'No cargo residue / contamination',                                                                },
  { id: 't-lin-3',  category: 'Lining',      label: 'Internal coating condition',                          measurementCm: true, cedexComponent: 'LIN' },
  // Tests (4)
  { id: 't-tst-1',  category: 'Testing',     label: 'Pressure test (per IMO class)',                                                                   },
  { id: 't-tst-2',  category: 'Testing',     label: 'Vacuum test (per IMO class)',                                                                     },
  { id: 't-tst-3',  category: 'Testing',     label: 'Hydrostatic test (5-year due check)',                                                              },
  { id: 't-tst-4',  category: 'Testing',     label: 'Leak test under pressure',                                                                        },
  // Plates + docs (4)
  { id: 't-plt-1',  category: 'Plates',      label: 'CSC plate present',                                                                                },
  { id: 't-plt-2',  category: 'Plates',      label: 'Last-cargo / cleaning certificate',                                                                },
  { id: 't-plt-3',  category: 'Plates',      label: 'Owner code + serial match register',                                                               },
  { id: 't-plt-4',  category: 'Plates',      label: 'Heating coil inspection (if equipped)',                                                            },
];

export const tankPhotoAngles: string[] = [
  'Front end (closed)',
  'Left side',
  'Right side',
  'Valve cluster (top + bottom)',
];

// ============================================================================
// REEFER (30 items) — Phase 6
// ============================================================================
export const reeferChecklist: ChecklistItem[] = [
  // External (5)
  { id: 'r-ext-1', category: 'External', label: 'Refrigeration unit external panel',                                                                  },
  { id: 'r-ext-2', category: 'External', label: 'Container box condition',                                  measurementCm: true, cedexComponent: 'SDR' },
  { id: 'r-ext-3', category: 'External', label: 'Plug socket + cable condition',                                                                       },
  { id: 'r-ext-4', category: 'External', label: 'Air intake / discharge grilles clear',                                                                },
  { id: 'r-ext-5', category: 'External', label: 'Defrost drains clear',                                                                                },
  // Doors (4)
  { id: 'r-dor-1', category: 'Doors',    label: 'Door gasket continuity (cold seal)',                                cedexComponent: 'GAS'  },
  { id: 'r-dor-2', category: 'Doors',    label: 'Door cam lock alignment',                                                                              },
  { id: 'r-dor-3', category: 'Doors',    label: 'Door header drip pan',                                                                                 },
  { id: 'r-dor-4', category: 'Doors',    label: 'Door operation smooth + lockable',                                                                     },
  // Interior (5)
  { id: 'r-int-1', category: 'Interior', label: 'T-bar floor + drainage channels clear',                                                               },
  { id: 'r-int-2', category: 'Interior', label: 'Side panel insulation visual',                                                                        },
  { id: 'r-int-3', category: 'Interior', label: 'Ceiling panel insulation visual',                                                                     },
  { id: 'r-int-4', category: 'Interior', label: 'Interior cleanliness + odor',                                                                         },
  { id: 'r-int-5', category: 'Interior', label: 'Cargo securing rails / e-track',                                                                      },
  // Refrigeration unit (8)
  { id: 'r-ref-1', category: 'Refrigeration', label: 'Compressor mounts + belt condition',                          cedexComponent: 'CMP'  },
  { id: 'r-ref-2', category: 'Refrigeration', label: 'Evaporator coil — no frost / damage',                                cedexComponent: 'EVA'  },
  { id: 'r-ref-3', category: 'Refrigeration', label: 'Condenser coil cleanliness',                                                                      },
  { id: 'r-ref-4', category: 'Refrigeration', label: 'Evaporator + condenser fan operation',                                cedexComponent: 'FAN'  },
  { id: 'r-ref-5', category: 'Refrigeration', label: 'Refrigerant charge level',                                                                        },
  { id: 'r-ref-6', category: 'Refrigeration', label: 'Sensor (return-air, supply-air, ambient) reads',                       cedexComponent: 'SNS'  },
  { id: 'r-ref-7', category: 'Refrigeration', label: 'Defrost cycle initiation OK',                                                                     },
  { id: 'r-ref-8', category: 'Refrigeration', label: 'No oil / refrigerant leaks',                                                                      },
  // Plates + docs (8)
  { id: 'r-plt-1', category: 'Plates',   label: 'CSC plate present + valid',                                                                            },
  { id: 'r-plt-2', category: 'Plates',   label: 'ATP plate validity (perishable cargo)',                                                                },
  { id: 'r-plt-3', category: 'Plates',   label: 'ACEP registration matches',                                                                            },
  { id: 'r-plt-4', category: 'Plates',   label: 'Owner code + serial match',                                                                            },
  { id: 'r-plt-5', category: 'Plates',   label: 'Unit serial + model match register',                                                                   },
  { id: 'r-plt-6', category: 'Plates',   label: 'Voltage + amperage labels legible',                                                                    },
  { id: 'r-plt-7', category: 'Plates',   label: 'Refrigerant type label matches charge',                                                                },
  { id: 'r-plt-8', category: 'Plates',   label: 'Last-trip controller log present',                                                                     },
];

export const reeferPhotoAngles: string[] = [
  'Refrigeration unit (front)',
  'Door interior (open)',
  'Floor + T-bar',
  'Controller display',
  'Plug + cable',
];

// ============================================================================
// PTI (25 items) — Phase 6 D-05
// ============================================================================
export const ptiChecklist: ChecklistItem[] = [
  // Setup (3)
  { id: 'p-set-1', category: 'Setup',         label: 'Pre-cool to 0°C, verify return-air reaches setpoint',                                       },
  { id: 'p-set-2', category: 'Setup',         label: 'Power source + voltage stable',                                                              },
  { id: 'p-set-3', category: 'Setup',         label: 'Container interior empty + clean',                                                          },
  // Controller log (4)
  { id: 'p-ctl-1', category: 'Controller',    label: 'Download trip log',                                                                          },
  { id: 'p-ctl-2', category: 'Controller',    label: 'No critical alarms in last trip',                                                            },
  { id: 'p-ctl-3', category: 'Controller',    label: 'Date / time clock accurate',                                                                  },
  { id: 'p-ctl-4', category: 'Controller',    label: 'Sensor calibration values within tolerance',                                                  },
  // Temperature ramp test (5)
  { id: 'p-trp-1', category: 'Temp ramp',     label: 'Cool from +25°C → -18°C in ≤ 4 hours',                                                       },
  { id: 'p-trp-2', category: 'Temp ramp',     label: 'Hold at -25°C for 1 hour, ±0.5°C',                                                           },
  { id: 'p-trp-3', category: 'Temp ramp',     label: 'Warm from -25°C → +20°C smoothly',                                                           },
  { id: 'p-trp-4', category: 'Temp ramp',     label: 'Hold at -29°C (max-cold setpoint) — verify capability',                                      },
  { id: 'p-trp-5', category: 'Temp ramp',     label: 'Final setpoint 0°C maintained ±0.3°C for 30 min',                                            },
  // Defrost cycle (3)
  { id: 'p-def-1', category: 'Defrost',       label: 'Initiate manual defrost — heater engages',                                                   },
  { id: 'p-def-2', category: 'Defrost',       label: 'Defrost terminates correctly',                                                                },
  { id: 'p-def-3', category: 'Defrost',       label: 'Drainage clears post-defrost',                                                                },
  // T-cycle (3)
  { id: 'p-tcy-1', category: 'T-cycle',       label: 'Temperature cycle 0°C → 2°C → 0°C without alarm',                                            },
  { id: 'p-tcy-2', category: 'T-cycle',       label: 'Compressor cycling normal',                                                                    },
  { id: 'p-tcy-3', category: 'T-cycle',       label: 'Fans cycle with compressor',                                                                  },
  // Inspection (4)
  { id: 'p-ins-1', category: 'Inspection',    label: 'Evaporator coil — no frost build-up',                            cedexComponent: 'EVA'        },
  { id: 'p-ins-2', category: 'Inspection',    label: 'Condenser coil clean',                                                                         },
  { id: 'p-ins-3', category: 'Inspection',    label: 'No oil residue on lines',                                                                      },
  { id: 'p-ins-4', category: 'Inspection',    label: 'No abnormal noise / vibration',                                                                },
  // ATP coverage (3)
  { id: 'p-atp-1', category: 'ATP',           label: 'ATP plate validity verified',                                                                   },
  { id: 'p-atp-2', category: 'ATP',           label: 'ATP class (FRC / RRC) matches operator declaration',                                            },
  { id: 'p-atp-3', category: 'ATP',           label: 'ATP certificate paperwork on file',                                                              },
];

export const ptiPhotoAngles: string[] = [
  'Controller display @ -25°C',
  'Defrost in progress',
  'Trip log printout',
  'ATP plate',
];

export function getChecklist(
  containerType: 'DRY' | 'TANK' | 'REEFER',
  isPti: boolean,
): { items: ChecklistItem[]; photos: string[] } {
  if (isPti) return { items: ptiChecklist, photos: ptiPhotoAngles };
  if (containerType === 'TANK') return { items: tankChecklist, photos: tankPhotoAngles };
  if (containerType === 'REEFER') return { items: reeferChecklist, photos: reeferPhotoAngles };
  return { items: dryChecklist, photos: dryPhotoAngles };
}
