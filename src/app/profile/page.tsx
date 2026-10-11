"use client";
import { Suspense } from "react";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { PersonalProfilePage } from "@/features/profile/page";
export default function Page(){return <Guard><Suspense fallback={null}><Shell><PersonalProfilePage/></Shell></Suspense></Guard>;}
