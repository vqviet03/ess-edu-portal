"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { Button, MenuItem, TextField, Typography } from "@/components/ui";
import { Feedback } from "@/components/feedback";
import { useClassesQuery } from "@/api/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { chooseClass } from "@/store/auth";
import { selectClass } from "@/models/report";
import { TeacherContacts } from "@/features/materials/contacts";
import { ClassTabs } from "@/features/materials/class-tabs";
function HomeContent() {
  const auth = useAppSelector((s) => s.auth),
    dispatch = useAppDispatch(),
    classes = useClassesQuery(),
    classroom = selectClass(classes.currentData ?? [], auth.classId),
    params = useSearchParams();
  useEffect(() => {
    if (classroom && auth.classId !== classroom.id)
      dispatch(chooseClass(classroom.id));
  }, [classroom, auth.classId, dispatch]);
  return (
    <Shell>
      <Typography variant="h4" component="h1">
        Lớp học của em
      </Typography>
      <Typography color="text.secondary" sx={{ my: 1 }}>
        {auth.student?.fullName}
        {auth.student?.nickname ? ` (${auth.student.nickname})` : ""} ·{" "}
        {classroom?.subject ?? "Học sinh"}
      </Typography>
      {classes.isLoading ? (
        <Feedback loading />
      ) : classes.error ? (
        <Feedback error={classes.error} retry={classes.refetch} />
      ) : !classroom ? (
        <Feedback empty="Chưa có lớp học nào." />
      ) : (
        <>
          <TextField
            select
            label="Lớp học"
            fullWidth
            value={classroom.id}
            onChange={(e) => dispatch(chooseClass(e.target.value))}
            sx={{ maxWidth: { md: 480 }, mb: 2 }}
          >
            {classes.currentData?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? " · Đang học" : ""}
              </MenuItem>
            ))}
          </TextField>
          <Button
            component={NextLink}
            href={`/materials/?classId=${encodeURIComponent(classroom.id)}`}
          >
            Tài liệu học tập
          </Button>
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
export default function Home() {
  return (
    <Guard>
      <Suspense fallback={<Feedback loading />}>
        <HomeContent />
      </Suspense>
    </Guard>
  );
}
