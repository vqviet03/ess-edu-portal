"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { MenuItem, Stack, TextField, Typography } from "@/components/ui";
import { Feedback } from "@/components/feedback";
import { useClassesQuery } from "@/api/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { chooseClass } from "@/store/auth";
import { selectClass } from "@/models/report";
import { TeacherContacts } from "@/features/materials/contacts";
import { ClassTabs } from "@/features/materials/class-tabs";
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
  const studentName = student
    ? `${student.fullName}${student.nickname ? ` (${student.nickname})` : ""}`
    : "";
  useEffect(() => {
    if (classroom && selectedClassId !== classroom.id)
      dispatch(chooseClass(classroom.id));
  }, [classroom, selectedClassId, dispatch]);
  return (
    <Shell
      context={
        classroom && (
          <Stack
            direction="row"
            sx={{ alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}
          >
            <Typography
              noWrap
              title={studentName}
              sx={{
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 700,
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              {studentName}
            </Typography>
            <ClassSwitcher
              classes={classes.currentData ?? []}
              value={classroom.id}
              onChange={(id) => {
                dispatch(chooseClass(id));
                const search = new URLSearchParams(params.toString());
                search.set("classId", id);
                search.delete("unitId");
                router.push(`${pathname}?${search}`, { scroll: false });
              }}
            />
          </Stack>
        )
      }
    >
      <PageHeader title="Lớp học của em" />
      {!classes.currentData && classes.isLoading ? (
        <Feedback loading />
      ) : !classes.currentData && classes.error ? (
        <Feedback error={classes.error} retry={classes.refetch} />
      ) : !classroom ? (
        <Feedback empty="Chưa có lớp học nào." />
      ) : (
        <>
          <Feedback error={classes.error} retry={classes.refetch} />
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
/** Compact class picker for the app header. */
function ClassSwitcher({
  classes,
  value,
  onChange,
}: {
  classes: { id: string; name: string; isActive?: boolean }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        select: {
          "aria-label": "Lớp học",
          renderValue: (id) => classes.find((x) => x.id === id)?.name ?? "",
        },
      }}
      sx={{
        minWidth: 0,
        flexShrink: 0,
        maxWidth: { xs: 150, sm: 240 },
        "& .MuiInputBase-root": {
          height: "36px !important",
          borderRadius: "10px",
          bgcolor: "action.hover",
          fontSize: 13,
          fontWeight: 600,
        },
        "& fieldset": { border: 0 },
        "& .MuiSelect-select": {
          py: "0 !important",
          pl: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }}
    >
      {classes.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
          {c.isActive ? " · Đang học" : ""}
        </MenuItem>
      ))}
    </TextField>
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
