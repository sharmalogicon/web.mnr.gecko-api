"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { EquipmentForm } from "@/components/equipment";
import { equipmentRepo } from "@/lib/repos";
import type { EquipmentFormInput } from "@/lib/validators/equipment";
import type { EquipmentRecord } from "@/lib/types";

function inputToRecord(input: EquipmentFormInput): EquipmentRecord {
  // ownerPrefix (3) + categoryIdentifier (U/J/Z) → canonical 4-char ownerCode
  const ownerCode = `${input.ownerPrefix.toUpperCase()}${input.categoryIdentifier}`;
  const serial = input.serial;
  const checkDigit = Number(input.checkDigit);
  const id = `${ownerCode}${serial}${checkDigit}`;
  const payloadKg = Number(input.maxGrossKg) - Number(input.tareKg);

  const base: EquipmentRecord = {
    id,
    ownerCode,
    serial,
    checkDigit,
    ownerName: input.ownerName,
    isoSizeType: input.isoSizeType.toUpperCase(),
    category: input.category,
    tareKg: Number(input.tareKg),
    maxGrossKg: Number(input.maxGrossKg),
    payloadKg,
    cubeM3: Number(input.cubeM3),
    depotCode: input.depotCode,
    status: input.status,
    lastSurveyDate: input.lastSurveyDate,
    internalLengthM: Number(input.internalLengthM),
    internalWidthM: Number(input.internalWidthM),
    internalHeightM: Number(input.internalHeightM),
    doorOpeningWidthM: Number(input.doorOpeningWidthM),
    doorOpeningHeightM: Number(input.doorOpeningHeightM),
    floorType: input.floorType,
    cscPlateId: input.cscPlateId,
    acepRegistration: input.acepRegistration,
    nextPeriodicExam: input.nextPeriodicExam,
    structuralTestDate: input.structuralTestDate,
    intermediateTestDate: input.intermediateTestDate,
  };

  if (input.category === "TANK") {
    base.tankShellMaterial = input.tankShellMaterial;
    base.tankPressureBar = Number(input.tankPressureBar);
    base.tankCapacityL = Number(input.tankCapacityL);
    base.tankImoClass = input.tankImoClass;
  } else if (input.category === "REEFER") {
    base.reeferRefrigerant = input.reeferRefrigerant;
    base.reeferUnitModel = input.reeferUnitModel;
    base.reeferSetpointMinC = Number(input.reeferSetpointMinC);
    base.reeferSetpointMaxC = Number(input.reeferSetpointMaxC);
    base.atpPlateValidity = input.atpPlateValidity;
  }

  return base;
}

export default function NewEquipmentPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <AppShell>
      <Link href="/equipment">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Equipment
        </Button>
      </Link>

      <EquipmentForm
        mode="create"
        submitError={submitError}
        onSubmit={async (input) => {
          setSubmitError(null);
          try {
            const record = inputToRecord(input);
            equipmentRepo.create(record);
            router.push(`/equipment/${encodeURIComponent(record.id)}`);
          } catch (err) {
            setSubmitError(
              err instanceof Error ? err.message : "Failed to register equipment",
            );
          }
        }}
      />
    </AppShell>
  );
}
