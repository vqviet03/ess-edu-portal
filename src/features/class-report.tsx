"use client";
import { useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import { Feedback } from "@/components/feedback";
import { useUnitsQuery, useProgressQuery, useReportQuery } from "@/api/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { chooseUnit } from "@/store/auth";
import { selectUnit } from "@/models/report";
import ReportView from "./report";
export function ClassReport({ classId }: { classId: string }) {
  const id = useAppSelector((s) => s.auth.unitId),
    dispatch = useAppDispatch(),
    units = useUnitsQuery(classId),
    unit = selectUnit(units.currentData ?? [], id);
  useEffect(() => {
    if (unit && id !== unit.id) dispatch(chooseUnit(unit.id));
  }, [unit, id, dispatch]);
  const report = useReportQuery(
      { classId, unitId: unit?.id ?? "" },
      { skip: !unit?.hasReport },
    ),
    progress = useProgressQuery(classId);
  if (units.isLoading || units.error)
    return (
      <Feedback
        loading={units.isLoading}
        error={units.error}
        retry={units.refetch}
      />
    );
  if (!unit) return <Feedback empty="Lớp này chưa có Unit học tập." />;
  return (
    <>
      <Tabs
        aria-label="Chọn Unit"
        value={unit.id}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, value: string) => dispatch(chooseUnit(value))}
        sx={{ mb: 2 }}
      >
        {units.currentData?.map((u) => (
          <Tab key={u.id} label={u.name} value={u.id} />
        ))}
      </Tabs>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ngày kiểm tra:{" "}
        {report.currentData?.testedAt
          ? new Date(report.currentData.testedAt).toLocaleDateString("vi-VN")
          : "Chưa cập nhật"}
      </Typography>
      {report.isLoading ? (
        <Feedback loading />
      ) : !unit.hasReport ? (
        <Feedback empty="Unit này chưa có báo cáo." />
      ) : report.error ? (
        <Feedback error={report.error} retry={report.refetch} />
      ) : report.currentData ? (
        <ReportView
          report={report.currentData}
          entries={progress.currentData ?? []}
          unitName={unit.name}
          progressLoading={progress.isLoading}
          progressError={progress.error}
          retryProgress={progress.refetch}
        />
      ) : null}
    </>
  );
}
