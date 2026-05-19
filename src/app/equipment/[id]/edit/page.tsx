"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { EquipmentForm } from "@/components/equipment";
import { equipmentRepo } from "@/lib/repos";
import type { EquipmentFormInput } from "@/lib/validators/equipment";
import type { EquipmentRecord } from "@/lib/types";

function recordToFormInput(record: EquipmentRecord): Partial<EquipmentFormInput> {
  // Split the 4-char ownerCode (e.g. "MSKU") into prefix + category identifier.
  const ownerPrefix = record.ownerCode.slice(0, 3);
  const categoryIdentifier = record.ownerCode.slice(3, 4) as "U" | "J" | "Z";

  return {
    ownerPrefix,
    categoryIdentifier,
    serial: record.serial,
    checkDigit: record.checkDigit,
    ownerName: record.ownerName,
    isoSizeType: record.isoSizeType,
    category: record.category,
    tareKg: record.tareKg,
    maxGrossKg: record.maxGrossKg,
    cubeM3: record.cubeM3,
    depotCode: record.depotCode,
    status: record.status,
    lastSurveyDate: record.lastSurveyDate,
    internalLengthM: record.internalLengthM,
    internalWidthM: record.internalWidthM,
    internalHeightM: record.internalHeightM,
    doorOpeningWidthM: record.doorOpeningWidthM,
    doorOpeningHeightM: record.doorOpeningHeightM,
    floorType: record.floorType,
    cscPlateId: record.cscPlateId,
    acepRegistration: record.acepRegistration,
    nextPeriodicExam: record.nextPeriodicExam,
    structuralTestDate: record.structuralTestDate,
    intermediateTestDate: record.intermediateTestDate,
    tankShellMaterial: record.tankShellMaterial,
    tankPressureBar: record.tankPressureBar,
    tankCapacityL: record.tankCapacityL,
    tankImoClass: record.tankImoClass,
    reeferRefrigerant: record.reeferRefrigerant,
    reeferUnitModel: record.reeferUnitModel,
    reeferSetpointMinC: record.reeferSetpointMinC,
    reeferSetpointMaxC: record.reeferSetpointMaxC,
    atpPlateValidity: record.atpPlateValidity,
  } as Partial<EquipmentFormInput>;
}

function inputToPatch(input: EquipmentFormInput): Partial<EquipmentRecord> {
  const patch: Partial<EquipmentRecord> = {
    ownerName: input.ownerName,
    isoSizeType: input.isoSizeType.toUpperCase(),
    category: input.category,
    tareKg: Number(input.tareKg),
    maxGrossKg: Number(input.maxGrossKg),
    payloadKg: Number(input.maxGrossKg) - Number(input.tareKg),
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
    patch.tankShellMaterial = input.tankShellMaterial;
    patch.tankPressureBar = Number(input.tankPressureBar);
    patch.tankCapacityL = Number(input.tankCapacityL);
    patch.tankImoClass = input.tankImoClass;
  } else if (input.category === "REEFER") {
    patch.reeferRefrigerant = input.reeferRefrigerant;
    patch.reeferUnitModel = input.reeferUnitModel;
    patch.reeferSetpointMinC = Number(input.reeferSetpointMinC);
    patch.reeferSetpointMaxC = Number(input.reeferSetpointMaxC);
    patch.atpPlateValidity = input.atpPlateValidity;
  }
  return patch;
}

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const record = equipmentRepo.get(id);

  if (!record) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="Equipment not found"
          description={`No container with id ${id}.`}
          primary={{ label: "Back to Equipment", href: "/equipment" }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href={`/equipment/${encodeURIComponent(id)}`}
        className="gecko-btn gecko-btn-ghost gecko-btn-sm mb-6 inline-flex"
      >
        <Icon name="arrowLeft" size={16} />
        Back to {id}
      </Link>

      <EquipmentForm
        mode="edit"
        defaultValues={recordToFormInput(record)}
        submitError={submitError}
        onSubmit={async (input) => {
          setSubmitError(null);
          try {
            equipmentRepo.update(id, inputToPatch(input));
            router.push(`/equipment/${encodeURIComponent(id)}`);
          } catch (err) {
            setSubmitError(
              err instanceof Error ? err.message : "Failed to save changes",
            );
          }
        }}
      />
    </AppShell>
  );
}
