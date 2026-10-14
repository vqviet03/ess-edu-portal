"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import NextLink from "next/link";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { MenuItem, TextField, Typography } from "@/components/ui";
import { Feedback } from "@/components/feedback";
import { useClassesQuery } from "@/api/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { chooseClass } from "@/store/auth";
import { selectClass } from "@/models/report";
import { TeacherContacts } from "@/features/materials/contacts";
import { ClassTabs } from "@/features/materials/class-tabs";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
function HomeContent() {
  const student = useAppSelector((s) => s.auth.student),
    selectedClassId = useAppSelector((s) => s.auth.classId),
    dispatch = useAppDispatch(),
    classes = useClassesQuery(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    requestedClass = classes.currentData?.find(
      (c) => c.id === params.get("classId"),
    ),
    classroom =
      requestedClass ?? selectClass(classes.currentData ?? [], selectedClassId);
  useEffect(() => {
    if (classroom && selectedClassId !== classroom.id)
      dispatch(chooseClass(classroom.id));
  }, [classroom, selectedClassId, dispatch]);
  return (
    <Shell>
      <Typography variant="h4" component="h1">
        Lớp học của em
      </Typography>
      <Typography color="text.secondary" sx={{ my: 1 }}>
        {student?.fullName}
        {student?.nickname ? ` (${student.nickname})` : ""} ·{" "}
        {classroom?.subject ?? "Học sinh"}
      </Typography>
      {!classes.currentData && classes.isLoading ? (
        <Feedback loading />
      ) : !classes.currentData && classes.error ? (
        <Feedback error={classes.error} retry={classes.refetch} />
      ) : !classroom ? (
        <Feedback empty="Chưa có lớp học nào." />
      ) : (
        <>
          <Feedback error={classes.error} retry={classes.refetch} />
          <TextField
            select
            label="Lớp học"
            fullWidth
            value={classroom.id}
            onChange={(e) => {
              dispatch(chooseClass(e.target.value));
              const search = new URLSearchParams(params.toString());
              search.set("classId", e.target.value);
              search.delete("unitId");
              router.push(`${pathname}?${search}`, { scroll: false });
            }}
            sx={{ maxWidth: { md: 480 }, mb: 2 }}
          >
            {classes.currentData?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? " · Đang học" : ""}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Tài liệu học tập">
            <IconButton
              component={NextLink}
              aria-label="Tài liệu học tập"
              href={`/materials/?classId=${encodeURIComponent(classroom.id)}`}
            >
              <FolderOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <TeacherContacts classId={classroom.id} />
          <ClassTabs
            key={classroom.id}
            classId={classroom.id}
            initialTab={params.get("tab") ?? "thread"}
          />
        </>
      )}
    </Shell>
  );
}
export function ClassHomePage() {
  return (
    <Guard>
      <Suspense fallback={<Feedback loading />}>
        <HomeContent />
      </Suspense>
    </Guard>
  );
}
