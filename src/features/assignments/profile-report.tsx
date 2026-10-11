"use client";
import {useState} from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {useClassesQuery} from "@/api/api";
import {Feedback} from "@/shared/ui";
import {AssignmentReportView} from "./report";
export function AssignmentProfileReport(){
 const query=useClassesQuery(),[selected,setSelected]=useState("");
 const classes=query.currentData ?? [];
 const id=classes.some(c=>c.id===selected)?selected:(classes.find(c=>c.isActive)??classes[0])?.id ?? "";
 return <Stack spacing={2}>
  <Feedback loading={query.isLoading} error={query.error} retry={()=>void query.refetch()} empty={!query.isLoading&&!query.error&&!classes.length?"Em chưa có lớp học.":undefined}/>
  {!!classes.length&&<TextField select size="small" label="Lớp học" value={id} onChange={e=>setSelected(e.target.value)}>{classes.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>}
  {!!id&&<AssignmentReportView key={id} classId={id}/>}
 </Stack>;
}
