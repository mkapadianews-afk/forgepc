import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Cpu, CircuitBoard, MemoryStick, HardDrive, Power, Box, Fan, MonitorPlay,
  Gamepad2, Clapperboard, Radio, Boxes, BrainCircuit, Briefcase,
  Sparkles, Save, Plus, Trash2, Check, X, AlertTriangle, ChevronRight,
  ChevronLeft, Zap, DollarSign, RotateCcw, ShieldCheck, ShieldAlert, Repeat2, Wrench, Send, Bot, MessageCircle, Maximize, Minimize, Settings, Sun, Moon
} from "lucide-react";

// Live-pricing endpoint (your deployed serverless function). When reachable it
// overrides the built-in sample prices; when not (e.g. inside Claude or offline)
// the app silently keeps the sample prices below.
const PRICES_URL = "/api/prices";

/* =========================================================================
   RIGFORGE — PC part picker w/ scoring, compatibility & saved builds
   Mock data stands in for the Best Buy API. Architecture is unchanged:
   a catalog + benchmark layer feeds a deterministic scoring/compat engine;
   the build score uses HYBRID mode (engine computes the number, a verdict
   generator narrates it — swap generateVerdict() for a live Claude call).
   ========================================================================= */

/* ----------------------------- MOCK CATALOG ----------------------------- */
const CATALOG = {
  /* Real models with accurate specs. GPUs include real board-partner VARIANTS grouped by `model`.
     Older parts (RX 580, GTX 1080 Ti, i3-10100, etc.) included for budget builds; Best Buy may not
     stock these new, so their live price can fall back to the sample value. */
  cpu: [
    {id:"cpu1",brand:"AMD",name:"Ryzen 5 4500",model:"Ryzen 5 4500",variantLabel:"AMD",price:80,perf:44,socket:"AM4",tdp:65,cores:6,igpu:false},
    {id:"cpu2",brand:"AMD",name:"Ryzen 5 5500",model:"Ryzen 5 5500",variantLabel:"AMD",price:95,perf:46,socket:"AM4",tdp:65,cores:6,igpu:false},
    {id:"cpu3",brand:"AMD",name:"Ryzen 5 5600",model:"Ryzen 5 5600",variantLabel:"AMD",price:100,perf:50,socket:"AM4",tdp:65,cores:6,igpu:false},
    {id:"cpu4",brand:"AMD",name:"Ryzen 5 5600G",model:"Ryzen 5 5600G",variantLabel:"AMD",price:140,perf:56,socket:"AM4",tdp:65,cores:6,igpu:true},
    {id:"cpu5",brand:"AMD",name:"Ryzen 5 5600X",model:"Ryzen 5 5600X",variantLabel:"AMD",price:120,perf:54,socket:"AM4",tdp:65,cores:6,igpu:false},
    {id:"cpu6",brand:"AMD",name:"Ryzen 7 5700X",model:"Ryzen 7 5700X",variantLabel:"AMD",price:160,perf:64,socket:"AM4",tdp:65,cores:8,igpu:false},
    {id:"cpu7",brand:"AMD",name:"Ryzen 7 5700X3D",model:"Ryzen 7 5700X3D",variantLabel:"AMD",price:230,perf:72,socket:"AM4",tdp:105,cores:8,igpu:false},
    {id:"cpu8",brand:"AMD",name:"Ryzen 9 5900X",model:"Ryzen 9 5900X",variantLabel:"AMD",price:260,perf:76,socket:"AM4",tdp:105,cores:12,igpu:false},
    {id:"cpu9",brand:"Intel",name:"Core i3-10100",model:"Core i3-10100",variantLabel:"Intel",price:100,perf:40,socket:"LGA1200",tdp:65,cores:4,igpu:true},
    {id:"cpu10",brand:"Intel",name:"Core i3-10105",model:"Core i3-10105",variantLabel:"Intel",price:110,perf:42,socket:"LGA1200",tdp:65,cores:4,igpu:true},
    {id:"cpu11",brand:"Intel",name:"Core i5-10400F",model:"Core i5-10400F",variantLabel:"Intel",price:130,perf:52,socket:"LGA1200",tdp:65,cores:6,igpu:false},
    {id:"cpu12",brand:"Intel",name:"Core i5-11400F",model:"Core i5-11400F",variantLabel:"Intel",price:150,perf:58,socket:"LGA1200",tdp:65,cores:6,igpu:false},
    {id:"cpu13",brand:"Intel",name:"Core i3-14100F",model:"Core i3-14100F",variantLabel:"Intel",price:110,perf:44,socket:"LGA1700",tdp:58,cores:4,igpu:false},
    {id:"cpu14",brand:"Intel",name:"Core i5-12400F",model:"Core i5-12400F",variantLabel:"Intel",price:110,perf:52,socket:"LGA1700",tdp:65,cores:6,igpu:false},
    {id:"cpu15",brand:"Intel",name:"Core i5-13400F",model:"Core i5-13400F",variantLabel:"Intel",price:150,perf:58,socket:"LGA1700",tdp:65,cores:10,igpu:false},
    {id:"cpu16",brand:"Intel",name:"Core i5-14400F",model:"Core i5-14400F",variantLabel:"Intel",price:160,perf:60,socket:"LGA1700",tdp:65,cores:10,igpu:false},
    {id:"cpu17",brand:"Intel",name:"Core i5-14600K",model:"Core i5-14600K",variantLabel:"Intel",price:230,perf:72,socket:"LGA1700",tdp:125,cores:14,igpu:true},
    {id:"cpu18",brand:"Intel",name:"Core i7-14700K",model:"Core i7-14700K",variantLabel:"Intel",price:330,perf:82,socket:"LGA1700",tdp:125,cores:20,igpu:true},
    {id:"cpu19",brand:"Intel",name:"Core i9-14900K",model:"Core i9-14900K",variantLabel:"Intel",price:450,perf:86,socket:"LGA1700",tdp:125,cores:24,igpu:true},
    {id:"cpu20",brand:"AMD",name:"Ryzen 5 7500F",model:"Ryzen 5 7500F",variantLabel:"AMD",price:170,perf:62,socket:"AM5",tdp:65,cores:6,igpu:false},
    {id:"cpu21",brand:"AMD",name:"Ryzen 5 7600",model:"Ryzen 5 7600",variantLabel:"AMD",price:200,perf:66,socket:"AM5",tdp:65,cores:6,igpu:true},
    {id:"cpu22",brand:"AMD",name:"Ryzen 5 7600X",model:"Ryzen 5 7600X",variantLabel:"AMD",price:230,perf:70,socket:"AM5",tdp:105,cores:6,igpu:true},
    {id:"cpu23",brand:"AMD",name:"Ryzen 7 7700",model:"Ryzen 7 7700",variantLabel:"AMD",price:300,perf:78,socket:"AM5",tdp:65,cores:8,igpu:true},
    {id:"cpu24",brand:"AMD",name:"Ryzen 7 7800X3D",model:"Ryzen 7 7800X3D",variantLabel:"AMD",price:360,perf:90,socket:"AM5",tdp:120,cores:8,igpu:true},
    {id:"cpu25",brand:"AMD",name:"Ryzen 9 7900X",model:"Ryzen 9 7900X",variantLabel:"AMD",price:380,perf:84,socket:"AM5",tdp:170,cores:12,igpu:true},
    {id:"cpu26",brand:"AMD",name:"Ryzen 9 7950X3D",model:"Ryzen 9 7950X3D",variantLabel:"AMD",price:560,perf:95,socket:"AM5",tdp:120,cores:16,igpu:true},
    {id:"cpu27",brand:"AMD",name:"Ryzen 5 9600X",model:"Ryzen 5 9600X",variantLabel:"AMD",price:250,perf:72,socket:"AM5",tdp:65,cores:6,igpu:true},
    {id:"cpu28",brand:"AMD",name:"Ryzen 7 9700X",model:"Ryzen 7 9700X",variantLabel:"AMD",price:330,perf:82,socket:"AM5",tdp:65,cores:8,igpu:true},
    {id:"cpu29",brand:"AMD",name:"Ryzen 7 9800X3D",model:"Ryzen 7 9800X3D",variantLabel:"AMD",price:460,perf:96,socket:"AM5",tdp:120,cores:8,igpu:true},
    {id:"cpu30",brand:"AMD",name:"Ryzen 9 9900X",model:"Ryzen 9 9900X",variantLabel:"AMD",price:400,perf:86,socket:"AM5",tdp:120,cores:12,igpu:true},
    {id:"cpu31",brand:"AMD",name:"Ryzen 9 9950X",model:"Ryzen 9 9950X",variantLabel:"AMD",price:600,perf:92,socket:"AM5",tdp:170,cores:16,igpu:true},
    {id:"cpu32",brand:"AMD",name:"Ryzen 9 9950X3D",model:"Ryzen 9 9950X3D",variantLabel:"AMD",price:700,perf:99,socket:"AM5",tdp:170,cores:16,igpu:true},
    {id:"cpu33",brand:"Intel",name:"Core Ultra 5 245K",model:"Core Ultra 5 245K",variantLabel:"Intel",price:300,perf:80,socket:"LGA1851",tdp:125,cores:14,igpu:true},
    {id:"cpu34",brand:"Intel",name:"Core Ultra 7 265K",model:"Core Ultra 7 265K",variantLabel:"Intel",price:400,perf:84,socket:"LGA1851",tdp:125,cores:20,igpu:true},
    {id:"cpu35",brand:"Intel",name:"Core Ultra 9 285K",model:"Core Ultra 9 285K",variantLabel:"Intel",price:600,perf:88,socket:"LGA1851",tdp:125,cores:24,igpu:true},
  ],
  gpu: [
    {id:"gpu_1",name:"Intel Limited Edition Intel Arc B570",brand:"Intel",model:"Intel Arc B570",variantLabel:"Intel Limited Edition",price:220,perf:24,vram:10,tdp:150,len:250},
    {id:"gpu_2",name:"ASRock Challenger Intel Arc B570",brand:"ASRock",model:"Intel Arc B570",variantLabel:"ASRock Challenger",price:225,perf:24,vram:10,tdp:150,len:255},
    {id:"gpu_3",name:"Sparkle Titan OC Intel Arc B570",brand:"Sparkle",model:"Intel Arc B570",variantLabel:"Sparkle Titan OC",price:230,perf:24,vram:10,tdp:150,len:258},
    {id:"gpu_4",name:"Gunnir Photon Intel Arc B570",brand:"Gunnir",model:"Intel Arc B570",variantLabel:"Gunnir Photon",price:235,perf:24,vram:10,tdp:150,len:260},
    {id:"gpu_5",name:"Intel Limited Edition Intel Arc B580",brand:"Intel",model:"Intel Arc B580",variantLabel:"Intel Limited Edition",price:260,perf:28,vram:12,tdp:190,len:272},
    {id:"gpu_6",name:"ASRock Challenger Intel Arc B580",brand:"ASRock",model:"Intel Arc B580",variantLabel:"ASRock Challenger",price:270,perf:28,vram:12,tdp:190,len:277},
    {id:"gpu_7",name:"Sparkle Titan OC Intel Arc B580",brand:"Sparkle",model:"Intel Arc B580",variantLabel:"Sparkle Titan OC",price:275,perf:28,vram:12,tdp:190,len:280},
    {id:"gpu_8",name:"Gunnir Photon Intel Arc B580",brand:"Gunnir",model:"Intel Arc B580",variantLabel:"Gunnir Photon",price:275,perf:28,vram:12,tdp:190,len:282},
    {id:"gpu_9",name:"Acer Predator BiFrost Intel Arc B580",brand:"Acer",model:"Intel Arc B580",variantLabel:"Acer Predator BiFrost",price:285,perf:28,vram:12,tdp:190,len:287},
    {id:"gpu_10",name:"Founders Edition GTX 1660 Super",brand:"Founders",model:"GTX 1660 Super",variantLabel:"Founders Edition",price:180,perf:18,vram:6,tdp:125,len:230},
    {id:"gpu_11",name:"EVGA GTX 1660 Super",brand:"EVGA",model:"GTX 1660 Super",variantLabel:"EVGA",price:190,perf:18,vram:6,tdp:125,len:240},
    {id:"gpu_12",name:"ASUS GTX 1660 Super",brand:"ASUS",model:"GTX 1660 Super",variantLabel:"ASUS",price:195,perf:18,vram:6,tdp:125,len:245},
    {id:"gpu_13",name:"Founders Edition GTX 1080 Ti",brand:"Founders",model:"GTX 1080 Ti",variantLabel:"Founders Edition",price:350,perf:27,vram:11,tdp:250,len:280},
    {id:"gpu_14",name:"EVGA GTX 1080 Ti",brand:"EVGA",model:"GTX 1080 Ti",variantLabel:"EVGA",price:370,perf:27,vram:11,tdp:250,len:290},
    {id:"gpu_15",name:"ASUS GTX 1080 Ti",brand:"ASUS",model:"GTX 1080 Ti",variantLabel:"ASUS",price:375,perf:27,vram:11,tdp:250,len:295},
    {id:"gpu_16",name:"MSI Gaming GTX 1080 Ti",brand:"MSI",model:"GTX 1080 Ti",variantLabel:"MSI Gaming",price:380,perf:27,vram:11,tdp:250,len:300},
    {id:"gpu_17",name:"Founders Edition RTX 3060",brand:"Founders",model:"RTX 3060",variantLabel:"Founders Edition",price:280,perf:26,vram:12,tdp:170,len:245},
    {id:"gpu_18",name:"EVGA RTX 3060",brand:"EVGA",model:"RTX 3060",variantLabel:"EVGA",price:295,perf:26,vram:12,tdp:170,len:255},
    {id:"gpu_19",name:"ASUS RTX 3060",brand:"ASUS",model:"RTX 3060",variantLabel:"ASUS",price:300,perf:26,vram:12,tdp:170,len:260},
    {id:"gpu_20",name:"MSI Gaming RTX 3060",brand:"MSI",model:"RTX 3060",variantLabel:"MSI Gaming",price:300,perf:26,vram:12,tdp:170,len:265},
    {id:"gpu_21",name:"Gigabyte RTX 3060",brand:"Gigabyte",model:"RTX 3060",variantLabel:"Gigabyte",price:295,perf:26,vram:12,tdp:170,len:260},
    {id:"gpu_22",name:"Founders Edition RTX 3060 Ti",brand:"Founders",model:"RTX 3060 Ti",variantLabel:"Founders Edition",price:340,perf:31,vram:8,tdp:200,len:245},
    {id:"gpu_23",name:"EVGA RTX 3060 Ti",brand:"EVGA",model:"RTX 3060 Ti",variantLabel:"EVGA",price:355,perf:31,vram:8,tdp:200,len:255},
    {id:"gpu_24",name:"ASUS RTX 3060 Ti",brand:"ASUS",model:"RTX 3060 Ti",variantLabel:"ASUS",price:365,perf:31,vram:8,tdp:200,len:260},
    {id:"gpu_25",name:"MSI Gaming RTX 3060 Ti",brand:"MSI",model:"RTX 3060 Ti",variantLabel:"MSI Gaming",price:365,perf:31,vram:8,tdp:200,len:265},
    {id:"gpu_26",name:"Founders Edition RTX 3070",brand:"Founders",model:"RTX 3070",variantLabel:"Founders Edition",price:420,perf:35,vram:8,tdp:220,len:270},
    {id:"gpu_27",name:"EVGA RTX 3070",brand:"EVGA",model:"RTX 3070",variantLabel:"EVGA",price:440,perf:35,vram:8,tdp:220,len:280},
    {id:"gpu_28",name:"ASUS RTX 3070",brand:"ASUS",model:"RTX 3070",variantLabel:"ASUS",price:450,perf:35,vram:8,tdp:220,len:285},
    {id:"gpu_29",name:"MSI Gaming RTX 3070",brand:"MSI",model:"RTX 3070",variantLabel:"MSI Gaming",price:455,perf:35,vram:8,tdp:220,len:290},
    {id:"gpu_30",name:"Sapphire RX 580 8GB",brand:"Sapphire",model:"RX 580 8GB",variantLabel:"Sapphire",price:150,perf:13,vram:8,tdp:185,len:240},
    {id:"gpu_31",name:"XFX RX 580 8GB",brand:"XFX",model:"RX 580 8GB",variantLabel:"XFX",price:155,perf:13,vram:8,tdp:185,len:245},
    {id:"gpu_32",name:"PowerColor RX 580 8GB",brand:"PowerColor",model:"RX 580 8GB",variantLabel:"PowerColor",price:160,perf:13,vram:8,tdp:185,len:250},
    {id:"gpu_33",name:"ASUS RX 580 8GB",brand:"ASUS",model:"RX 580 8GB",variantLabel:"ASUS",price:160,perf:13,vram:8,tdp:185,len:255},
    {id:"gpu_34",name:"Sapphire RX 6600",brand:"Sapphire",model:"RX 6600",variantLabel:"Sapphire",price:200,perf:23,vram:8,tdp:132,len:200},
    {id:"gpu_35",name:"XFX RX 6600",brand:"XFX",model:"RX 6600",variantLabel:"XFX",price:205,perf:23,vram:8,tdp:132,len:205},
    {id:"gpu_36",name:"PowerColor RX 6600",brand:"PowerColor",model:"RX 6600",variantLabel:"PowerColor",price:210,perf:23,vram:8,tdp:132,len:210},
    {id:"gpu_37",name:"ASUS RX 6600",brand:"ASUS",model:"RX 6600",variantLabel:"ASUS",price:215,perf:23,vram:8,tdp:132,len:215},
    {id:"gpu_38",name:"Sapphire RX 6600 XT",brand:"Sapphire",model:"RX 6600 XT",variantLabel:"Sapphire",price:250,perf:26,vram:8,tdp:160,len:230},
    {id:"gpu_39",name:"XFX RX 6600 XT",brand:"XFX",model:"RX 6600 XT",variantLabel:"XFX",price:260,perf:26,vram:8,tdp:160,len:235},
    {id:"gpu_40",name:"PowerColor RX 6600 XT",brand:"PowerColor",model:"RX 6600 XT",variantLabel:"PowerColor",price:265,perf:26,vram:8,tdp:160,len:240},
    {id:"gpu_41",name:"Sapphire RX 6750 XT",brand:"Sapphire",model:"RX 6750 XT",variantLabel:"Sapphire",price:330,perf:35,vram:12,tdp:250,len:280},
    {id:"gpu_42",name:"XFX RX 6750 XT",brand:"XFX",model:"RX 6750 XT",variantLabel:"XFX",price:340,perf:35,vram:12,tdp:250,len:285},
    {id:"gpu_43",name:"PowerColor RX 6750 XT",brand:"PowerColor",model:"RX 6750 XT",variantLabel:"PowerColor",price:345,perf:35,vram:12,tdp:250,len:290},
    {id:"gpu_44",name:"Sapphire RX 6800 XT",brand:"Sapphire",model:"RX 6800 XT",variantLabel:"Sapphire",price:480,perf:41,vram:16,tdp:300,len:290},
    {id:"gpu_45",name:"XFX RX 6800 XT",brand:"XFX",model:"RX 6800 XT",variantLabel:"XFX",price:495,perf:41,vram:16,tdp:300,len:295},
    {id:"gpu_46",name:"PowerColor RX 6800 XT",brand:"PowerColor",model:"RX 6800 XT",variantLabel:"PowerColor",price:505,perf:41,vram:16,tdp:300,len:300},
    {id:"gpu_47",name:"PNY Verto RTX 4060",brand:"PNY",model:"RTX 4060",variantLabel:"PNY Verto",price:290,perf:29,vram:8,tdp:115,len:245},
    {id:"gpu_48",name:"Zotac Twin Edge RTX 4060",brand:"Zotac",model:"RTX 4060",variantLabel:"Zotac Twin Edge",price:295,perf:29,vram:8,tdp:115,len:250},
    {id:"gpu_49",name:"Gigabyte Windforce RTX 4060",brand:"Gigabyte",model:"RTX 4060",variantLabel:"Gigabyte Windforce",price:300,perf:29,vram:8,tdp:115,len:260},
    {id:"gpu_50",name:"MSI Ventus 2X RTX 4060",brand:"MSI",model:"RTX 4060",variantLabel:"MSI Ventus 2X",price:305,perf:29,vram:8,tdp:115,len:255},
    {id:"gpu_51",name:"ASUS Dual RTX 4060",brand:"ASUS",model:"RTX 4060",variantLabel:"ASUS Dual",price:305,perf:29,vram:8,tdp:115,len:257},
    {id:"gpu_52",name:"Gigabyte Eagle RTX 4060",brand:"Gigabyte",model:"RTX 4060",variantLabel:"Gigabyte Eagle",price:310,perf:29,vram:8,tdp:115,len:260},
    {id:"gpu_53",name:"MSI Ventus 3X RTX 4060",brand:"MSI",model:"RTX 4060",variantLabel:"MSI Ventus 3X",price:315,perf:29,vram:8,tdp:115,len:265},
    {id:"gpu_54",name:"Gigabyte Gaming OC RTX 4060",brand:"Gigabyte",model:"RTX 4060",variantLabel:"Gigabyte Gaming OC",price:320,perf:29,vram:8,tdp:115,len:270},
    {id:"gpu_55",name:"PNY Verto RTX 4060 Ti 8GB",brand:"PNY",model:"RTX 4060 Ti 8GB",variantLabel:"PNY Verto",price:370,perf:32,vram:8,tdp:160,len:245},
    {id:"gpu_56",name:"Zotac Twin Edge RTX 4060 Ti 8GB",brand:"Zotac",model:"RTX 4060 Ti 8GB",variantLabel:"Zotac Twin Edge",price:375,perf:32,vram:8,tdp:160,len:250},
    {id:"gpu_57",name:"Gigabyte Windforce RTX 4060 Ti 8GB",brand:"Gigabyte",model:"RTX 4060 Ti 8GB",variantLabel:"Gigabyte Windforce",price:385,perf:32,vram:8,tdp:160,len:260},
    {id:"gpu_58",name:"MSI Ventus 2X RTX 4060 Ti 8GB",brand:"MSI",model:"RTX 4060 Ti 8GB",variantLabel:"MSI Ventus 2X",price:390,perf:32,vram:8,tdp:160,len:255},
    {id:"gpu_59",name:"ASUS Dual RTX 4060 Ti 8GB",brand:"ASUS",model:"RTX 4060 Ti 8GB",variantLabel:"ASUS Dual",price:390,perf:32,vram:8,tdp:160,len:257},
    {id:"gpu_60",name:"Gigabyte Eagle RTX 4060 Ti 8GB",brand:"Gigabyte",model:"RTX 4060 Ti 8GB",variantLabel:"Gigabyte Eagle",price:395,perf:32,vram:8,tdp:160,len:260},
    {id:"gpu_61",name:"MSI Ventus 3X RTX 4060 Ti 8GB",brand:"MSI",model:"RTX 4060 Ti 8GB",variantLabel:"MSI Ventus 3X",price:400,perf:32,vram:8,tdp:160,len:265},
    {id:"gpu_62",name:"PNY Verto RTX 4060 Ti 16GB",brand:"PNY",model:"RTX 4060 Ti 16GB",variantLabel:"PNY Verto",price:430,perf:33,vram:16,tdp:165,len:250},
    {id:"gpu_63",name:"Zotac Twin Edge RTX 4060 Ti 16GB",brand:"Zotac",model:"RTX 4060 Ti 16GB",variantLabel:"Zotac Twin Edge",price:440,perf:33,vram:16,tdp:165,len:255},
    {id:"gpu_64",name:"Gigabyte Windforce RTX 4060 Ti 16GB",brand:"Gigabyte",model:"RTX 4060 Ti 16GB",variantLabel:"Gigabyte Windforce",price:445,perf:33,vram:16,tdp:165,len:265},
    {id:"gpu_65",name:"MSI Ventus 2X RTX 4060 Ti 16GB",brand:"MSI",model:"RTX 4060 Ti 16GB",variantLabel:"MSI Ventus 2X",price:450,perf:33,vram:16,tdp:165,len:260},
    {id:"gpu_66",name:"ASUS Dual RTX 4060 Ti 16GB",brand:"ASUS",model:"RTX 4060 Ti 16GB",variantLabel:"ASUS Dual",price:455,perf:33,vram:16,tdp:165,len:262},
    {id:"gpu_67",name:"Gigabyte Eagle RTX 4060 Ti 16GB",brand:"Gigabyte",model:"RTX 4060 Ti 16GB",variantLabel:"Gigabyte Eagle",price:460,perf:33,vram:16,tdp:165,len:265},
    {id:"gpu_68",name:"MSI Ventus 3X RTX 4060 Ti 16GB",brand:"MSI",model:"RTX 4060 Ti 16GB",variantLabel:"MSI Ventus 3X",price:465,perf:33,vram:16,tdp:165,len:270},
    {id:"gpu_69",name:"PNY Verto RTX 4070 Super",brand:"PNY",model:"RTX 4070 Super",variantLabel:"PNY Verto",price:600,perf:47,vram:12,tdp:220,len:285},
    {id:"gpu_70",name:"Zotac Twin Edge RTX 4070 Super",brand:"Zotac",model:"RTX 4070 Super",variantLabel:"Zotac Twin Edge",price:610,perf:47,vram:12,tdp:220,len:290},
    {id:"gpu_71",name:"Gigabyte Windforce RTX 4070 Super",brand:"Gigabyte",model:"RTX 4070 Super",variantLabel:"Gigabyte Windforce",price:625,perf:47,vram:12,tdp:220,len:300},
    {id:"gpu_72",name:"MSI Ventus 2X RTX 4070 Super",brand:"MSI",model:"RTX 4070 Super",variantLabel:"MSI Ventus 2X",price:630,perf:47,vram:12,tdp:220,len:295},
    {id:"gpu_73",name:"ASUS Dual RTX 4070 Super",brand:"ASUS",model:"RTX 4070 Super",variantLabel:"ASUS Dual",price:635,perf:47,vram:12,tdp:220,len:297},
    {id:"gpu_74",name:"Gigabyte Eagle RTX 4070 Super",brand:"Gigabyte",model:"RTX 4070 Super",variantLabel:"Gigabyte Eagle",price:640,perf:47,vram:12,tdp:220,len:300},
    {id:"gpu_75",name:"MSI Ventus 3X RTX 4070 Super",brand:"MSI",model:"RTX 4070 Super",variantLabel:"MSI Ventus 3X",price:650,perf:47,vram:12,tdp:220,len:305},
    {id:"gpu_76",name:"Gigabyte Gaming OC RTX 4070 Super",brand:"Gigabyte",model:"RTX 4070 Super",variantLabel:"Gigabyte Gaming OC",price:660,perf:47,vram:12,tdp:220,len:310},
    {id:"gpu_77",name:"PNY Verto RTX 4070 Ti Super",brand:"PNY",model:"RTX 4070 Ti Super",variantLabel:"PNY Verto",price:800,perf:56,vram:16,tdp:285,len:305},
    {id:"gpu_78",name:"Zotac Twin Edge RTX 4070 Ti Super",brand:"Zotac",model:"RTX 4070 Ti Super",variantLabel:"Zotac Twin Edge",price:815,perf:56,vram:16,tdp:285,len:310},
    {id:"gpu_79",name:"Gigabyte Windforce RTX 4070 Ti Super",brand:"Gigabyte",model:"RTX 4070 Ti Super",variantLabel:"Gigabyte Windforce",price:830,perf:56,vram:16,tdp:285,len:320},
    {id:"gpu_80",name:"MSI Ventus 2X RTX 4070 Ti Super",brand:"MSI",model:"RTX 4070 Ti Super",variantLabel:"MSI Ventus 2X",price:840,perf:56,vram:16,tdp:285,len:315},
    {id:"gpu_81",name:"ASUS Dual RTX 4070 Ti Super",brand:"ASUS",model:"RTX 4070 Ti Super",variantLabel:"ASUS Dual",price:850,perf:56,vram:16,tdp:285,len:317},
    {id:"gpu_82",name:"Gigabyte Eagle RTX 4070 Ti Super",brand:"Gigabyte",model:"RTX 4070 Ti Super",variantLabel:"Gigabyte Eagle",price:855,perf:56,vram:16,tdp:285,len:320},
    {id:"gpu_83",name:"MSI Ventus 3X RTX 4070 Ti Super",brand:"MSI",model:"RTX 4070 Ti Super",variantLabel:"MSI Ventus 3X",price:865,perf:56,vram:16,tdp:285,len:325},
    {id:"gpu_84",name:"PNY Verto RTX 5050",brand:"PNY",model:"RTX 5050",variantLabel:"PNY Verto",price:250,perf:22,vram:8,tdp:130,len:244},
    {id:"gpu_85",name:"Zotac Twin Edge RTX 5050",brand:"Zotac",model:"RTX 5050",variantLabel:"Zotac Twin Edge",price:255,perf:22,vram:8,tdp:130,len:249},
    {id:"gpu_86",name:"Gigabyte Windforce RTX 5050",brand:"Gigabyte",model:"RTX 5050",variantLabel:"Gigabyte Windforce",price:260,perf:22,vram:8,tdp:130,len:259},
    {id:"gpu_87",name:"MSI Ventus 2X RTX 5050",brand:"MSI",model:"RTX 5050",variantLabel:"MSI Ventus 2X",price:265,perf:22,vram:8,tdp:130,len:254},
    {id:"gpu_88",name:"ASUS Dual RTX 5050",brand:"ASUS",model:"RTX 5050",variantLabel:"ASUS Dual",price:265,perf:22,vram:8,tdp:130,len:256},
    {id:"gpu_89",name:"Gigabyte Eagle RTX 5050",brand:"Gigabyte",model:"RTX 5050",variantLabel:"Gigabyte Eagle",price:270,perf:22,vram:8,tdp:130,len:259},
    {id:"gpu_90",name:"PNY Verto RTX 5060",brand:"PNY",model:"RTX 5060",variantLabel:"PNY Verto",price:300,perf:30,vram:8,tdp:145,len:245},
    {id:"gpu_91",name:"Zotac Twin Edge RTX 5060",brand:"Zotac",model:"RTX 5060",variantLabel:"Zotac Twin Edge",price:305,perf:30,vram:8,tdp:145,len:250},
    {id:"gpu_92",name:"Gigabyte Windforce RTX 5060",brand:"Gigabyte",model:"RTX 5060",variantLabel:"Gigabyte Windforce",price:310,perf:30,vram:8,tdp:145,len:260},
    {id:"gpu_93",name:"MSI Ventus 2X RTX 5060",brand:"MSI",model:"RTX 5060",variantLabel:"MSI Ventus 2X",price:315,perf:30,vram:8,tdp:145,len:255},
    {id:"gpu_94",name:"ASUS Dual RTX 5060",brand:"ASUS",model:"RTX 5060",variantLabel:"ASUS Dual",price:320,perf:30,vram:8,tdp:145,len:257},
    {id:"gpu_95",name:"Gigabyte Eagle RTX 5060",brand:"Gigabyte",model:"RTX 5060",variantLabel:"Gigabyte Eagle",price:320,perf:30,vram:8,tdp:145,len:260},
    {id:"gpu_96",name:"MSI Ventus 3X RTX 5060",brand:"MSI",model:"RTX 5060",variantLabel:"MSI Ventus 3X",price:325,perf:30,vram:8,tdp:145,len:265},
    {id:"gpu_97",name:"Gigabyte Gaming OC RTX 5060",brand:"Gigabyte",model:"RTX 5060",variantLabel:"Gigabyte Gaming OC",price:330,perf:30,vram:8,tdp:145,len:270},
    {id:"gpu_98",name:"Zotac Trinity RTX 5060",brand:"Zotac",model:"RTX 5060",variantLabel:"Zotac Trinity",price:335,perf:30,vram:8,tdp:145,len:270},
    {id:"gpu_99",name:"MSI Gaming Trio RTX 5060",brand:"MSI",model:"RTX 5060",variantLabel:"MSI Gaming Trio",price:340,perf:30,vram:8,tdp:145,len:275},
    {id:"gpu_100",name:"PNY Verto RTX 5060 Ti 8GB",brand:"PNY",model:"RTX 5060 Ti 8GB",variantLabel:"PNY Verto",price:380,perf:33,vram:8,tdp:180,len:245},
    {id:"gpu_101",name:"Zotac Twin Edge RTX 5060 Ti 8GB",brand:"Zotac",model:"RTX 5060 Ti 8GB",variantLabel:"Zotac Twin Edge",price:390,perf:33,vram:8,tdp:180,len:250},
    {id:"gpu_102",name:"Gigabyte Windforce RTX 5060 Ti 8GB",brand:"Gigabyte",model:"RTX 5060 Ti 8GB",variantLabel:"Gigabyte Windforce",price:395,perf:33,vram:8,tdp:180,len:260},
    {id:"gpu_103",name:"MSI Ventus 2X RTX 5060 Ti 8GB",brand:"MSI",model:"RTX 5060 Ti 8GB",variantLabel:"MSI Ventus 2X",price:400,perf:33,vram:8,tdp:180,len:255},
    {id:"gpu_104",name:"ASUS Dual RTX 5060 Ti 8GB",brand:"ASUS",model:"RTX 5060 Ti 8GB",variantLabel:"ASUS Dual",price:405,perf:33,vram:8,tdp:180,len:257},
    {id:"gpu_105",name:"Gigabyte Eagle RTX 5060 Ti 8GB",brand:"Gigabyte",model:"RTX 5060 Ti 8GB",variantLabel:"Gigabyte Eagle",price:405,perf:33,vram:8,tdp:180,len:260},
    {id:"gpu_106",name:"MSI Ventus 3X RTX 5060 Ti 8GB",brand:"MSI",model:"RTX 5060 Ti 8GB",variantLabel:"MSI Ventus 3X",price:410,perf:33,vram:8,tdp:180,len:265},
    {id:"gpu_107",name:"Gigabyte Gaming OC RTX 5060 Ti 8GB",brand:"Gigabyte",model:"RTX 5060 Ti 8GB",variantLabel:"Gigabyte Gaming OC",price:420,perf:33,vram:8,tdp:180,len:270},
    {id:"gpu_108",name:"PNY Verto RTX 5060 Ti 16GB",brand:"PNY",model:"RTX 5060 Ti 16GB",variantLabel:"PNY Verto",price:430,perf:35,vram:16,tdp:180,len:250},
    {id:"gpu_109",name:"Zotac Twin Edge RTX 5060 Ti 16GB",brand:"Zotac",model:"RTX 5060 Ti 16GB",variantLabel:"Zotac Twin Edge",price:440,perf:35,vram:16,tdp:180,len:255},
    {id:"gpu_110",name:"Gigabyte Windforce RTX 5060 Ti 16GB",brand:"Gigabyte",model:"RTX 5060 Ti 16GB",variantLabel:"Gigabyte Windforce",price:445,perf:35,vram:16,tdp:180,len:265},
    {id:"gpu_111",name:"MSI Ventus 2X RTX 5060 Ti 16GB",brand:"MSI",model:"RTX 5060 Ti 16GB",variantLabel:"MSI Ventus 2X",price:450,perf:35,vram:16,tdp:180,len:260},
    {id:"gpu_112",name:"ASUS Dual RTX 5060 Ti 16GB",brand:"ASUS",model:"RTX 5060 Ti 16GB",variantLabel:"ASUS Dual",price:455,perf:35,vram:16,tdp:180,len:262},
    {id:"gpu_113",name:"Gigabyte Eagle RTX 5060 Ti 16GB",brand:"Gigabyte",model:"RTX 5060 Ti 16GB",variantLabel:"Gigabyte Eagle",price:460,perf:35,vram:16,tdp:180,len:265},
    {id:"gpu_114",name:"MSI Ventus 3X RTX 5060 Ti 16GB",brand:"MSI",model:"RTX 5060 Ti 16GB",variantLabel:"MSI Ventus 3X",price:465,perf:35,vram:16,tdp:180,len:270},
    {id:"gpu_115",name:"Gigabyte Gaming OC RTX 5060 Ti 16GB",brand:"Gigabyte",model:"RTX 5060 Ti 16GB",variantLabel:"Gigabyte Gaming OC",price:475,perf:35,vram:16,tdp:180,len:275},
    {id:"gpu_116",name:"Zotac Trinity RTX 5060 Ti 16GB",brand:"Zotac",model:"RTX 5060 Ti 16GB",variantLabel:"Zotac Trinity",price:475,perf:35,vram:16,tdp:180,len:275},
    {id:"gpu_117",name:"MSI Gaming Trio RTX 5060 Ti 16GB",brand:"MSI",model:"RTX 5060 Ti 16GB",variantLabel:"MSI Gaming Trio",price:485,perf:35,vram:16,tdp:180,len:280},
    {id:"gpu_118",name:"PNY Verto RTX 5070",brand:"PNY",model:"RTX 5070",variantLabel:"PNY Verto",price:635,perf:43,vram:12,tdp:250,len:280},
    {id:"gpu_119",name:"Zotac Twin Edge RTX 5070",brand:"Zotac",model:"RTX 5070",variantLabel:"Zotac Twin Edge",price:650,perf:43,vram:12,tdp:250,len:285},
    {id:"gpu_120",name:"Gigabyte Windforce RTX 5070",brand:"Gigabyte",model:"RTX 5070",variantLabel:"Gigabyte Windforce",price:660,perf:43,vram:12,tdp:250,len:295},
    {id:"gpu_121",name:"MSI Ventus 2X RTX 5070",brand:"MSI",model:"RTX 5070",variantLabel:"MSI Ventus 2X",price:665,perf:43,vram:12,tdp:250,len:290},
    {id:"gpu_122",name:"ASUS Dual RTX 5070",brand:"ASUS",model:"RTX 5070",variantLabel:"ASUS Dual",price:675,perf:43,vram:12,tdp:250,len:292},
    {id:"gpu_123",name:"Gigabyte Eagle RTX 5070",brand:"Gigabyte",model:"RTX 5070",variantLabel:"Gigabyte Eagle",price:680,perf:43,vram:12,tdp:250,len:295},
    {id:"gpu_124",name:"MSI Ventus 3X RTX 5070",brand:"MSI",model:"RTX 5070",variantLabel:"MSI Ventus 3X",price:685,perf:43,vram:12,tdp:250,len:300},
    {id:"gpu_125",name:"Gigabyte Gaming OC RTX 5070",brand:"Gigabyte",model:"RTX 5070",variantLabel:"Gigabyte Gaming OC",price:700,perf:43,vram:12,tdp:250,len:305},
    {id:"gpu_126",name:"Zotac Trinity RTX 5070",brand:"Zotac",model:"RTX 5070",variantLabel:"Zotac Trinity",price:705,perf:43,vram:12,tdp:250,len:305},
    {id:"gpu_127",name:"MSI Gaming Trio RTX 5070",brand:"MSI",model:"RTX 5070",variantLabel:"MSI Gaming Trio",price:720,perf:43,vram:12,tdp:250,len:310},
    {id:"gpu_128",name:"ASUS TUF OC RTX 5070",brand:"ASUS",model:"RTX 5070",variantLabel:"ASUS TUF OC",price:730,perf:43,vram:12,tdp:250,len:315},
    {id:"gpu_129",name:"ASUS ROG Strix RTX 5070",brand:"ASUS",model:"RTX 5070",variantLabel:"ASUS ROG Strix",price:775,perf:43,vram:12,tdp:250,len:320},
    {id:"gpu_130",name:"PNY Verto RTX 5070 Ti",brand:"PNY",model:"RTX 5070 Ti",variantLabel:"PNY Verto",price:1000,perf:57,vram:16,tdp:300,len:300},
    {id:"gpu_131",name:"Zotac Twin Edge RTX 5070 Ti",brand:"Zotac",model:"RTX 5070 Ti",variantLabel:"Zotac Twin Edge",price:1020,perf:57,vram:16,tdp:300,len:305},
    {id:"gpu_132",name:"Gigabyte Windforce RTX 5070 Ti",brand:"Gigabyte",model:"RTX 5070 Ti",variantLabel:"Gigabyte Windforce",price:1040,perf:57,vram:16,tdp:300,len:315},
    {id:"gpu_133",name:"MSI Ventus 2X RTX 5070 Ti",brand:"MSI",model:"RTX 5070 Ti",variantLabel:"MSI Ventus 2X",price:1050,perf:57,vram:16,tdp:300,len:310},
    {id:"gpu_134",name:"ASUS Dual RTX 5070 Ti",brand:"ASUS",model:"RTX 5070 Ti",variantLabel:"ASUS Dual",price:1060,perf:57,vram:16,tdp:300,len:312},
    {id:"gpu_135",name:"Gigabyte Eagle RTX 5070 Ti",brand:"Gigabyte",model:"RTX 5070 Ti",variantLabel:"Gigabyte Eagle",price:1070,perf:57,vram:16,tdp:300,len:315},
    {id:"gpu_136",name:"MSI Ventus 3X RTX 5070 Ti",brand:"MSI",model:"RTX 5070 Ti",variantLabel:"MSI Ventus 3X",price:1080,perf:57,vram:16,tdp:300,len:320},
    {id:"gpu_137",name:"Gigabyte Gaming OC RTX 5070 Ti",brand:"Gigabyte",model:"RTX 5070 Ti",variantLabel:"Gigabyte Gaming OC",price:1100,perf:57,vram:16,tdp:300,len:325},
    {id:"gpu_138",name:"Zotac Trinity RTX 5070 Ti",brand:"Zotac",model:"RTX 5070 Ti",variantLabel:"Zotac Trinity",price:1110,perf:57,vram:16,tdp:300,len:325},
    {id:"gpu_139",name:"MSI Gaming Trio RTX 5070 Ti",brand:"MSI",model:"RTX 5070 Ti",variantLabel:"MSI Gaming Trio",price:1130,perf:57,vram:16,tdp:300,len:330},
    {id:"gpu_140",name:"PNY Verto RTX 5080",brand:"PNY",model:"RTX 5080",variantLabel:"PNY Verto",price:1250,perf:72,vram:16,tdp:360,len:330},
    {id:"gpu_141",name:"Zotac Twin Edge RTX 5080",brand:"Zotac",model:"RTX 5080",variantLabel:"Zotac Twin Edge",price:1275,perf:72,vram:16,tdp:360,len:335},
    {id:"gpu_142",name:"Gigabyte Windforce RTX 5080",brand:"Gigabyte",model:"RTX 5080",variantLabel:"Gigabyte Windforce",price:1300,perf:72,vram:16,tdp:360,len:345},
    {id:"gpu_143",name:"MSI Ventus 2X RTX 5080",brand:"MSI",model:"RTX 5080",variantLabel:"MSI Ventus 2X",price:1315,perf:72,vram:16,tdp:360,len:340},
    {id:"gpu_144",name:"ASUS Dual RTX 5080",brand:"ASUS",model:"RTX 5080",variantLabel:"ASUS Dual",price:1325,perf:72,vram:16,tdp:360,len:342},
    {id:"gpu_145",name:"Gigabyte Eagle RTX 5080",brand:"Gigabyte",model:"RTX 5080",variantLabel:"Gigabyte Eagle",price:1340,perf:72,vram:16,tdp:360,len:345},
    {id:"gpu_146",name:"MSI Ventus 3X RTX 5080",brand:"MSI",model:"RTX 5080",variantLabel:"MSI Ventus 3X",price:1350,perf:72,vram:16,tdp:360,len:350},
    {id:"gpu_147",name:"Gigabyte Gaming OC RTX 5080",brand:"Gigabyte",model:"RTX 5080",variantLabel:"Gigabyte Gaming OC",price:1375,perf:72,vram:16,tdp:360,len:355},
    {id:"gpu_148",name:"Zotac Trinity RTX 5080",brand:"Zotac",model:"RTX 5080",variantLabel:"Zotac Trinity",price:1390,perf:72,vram:16,tdp:360,len:355},
    {id:"gpu_149",name:"PNY Verto RTX 5090",brand:"PNY",model:"RTX 5090",variantLabel:"PNY Verto",price:3000,perf:100,vram:32,tdp:575,len:358},
    {id:"gpu_150",name:"Zotac Twin Edge RTX 5090",brand:"Zotac",model:"RTX 5090",variantLabel:"Zotac Twin Edge",price:3060,perf:100,vram:32,tdp:575,len:363},
    {id:"gpu_151",name:"Gigabyte Windforce RTX 5090",brand:"Gigabyte",model:"RTX 5090",variantLabel:"Gigabyte Windforce",price:3120,perf:100,vram:32,tdp:575,len:373},
    {id:"gpu_152",name:"MSI Ventus 2X RTX 5090",brand:"MSI",model:"RTX 5090",variantLabel:"MSI Ventus 2X",price:3150,perf:100,vram:32,tdp:575,len:368},
    {id:"gpu_153",name:"ASUS Dual RTX 5090",brand:"ASUS",model:"RTX 5090",variantLabel:"ASUS Dual",price:3180,perf:100,vram:32,tdp:575,len:370},
    {id:"gpu_154",name:"Gigabyte Eagle RTX 5090",brand:"Gigabyte",model:"RTX 5090",variantLabel:"Gigabyte Eagle",price:3210,perf:100,vram:32,tdp:575,len:373},
    {id:"gpu_155",name:"PowerColor Reaper RX 7600",brand:"PowerColor",model:"RX 7600",variantLabel:"PowerColor Reaper",price:270,perf:27,vram:8,tdp:165,len:245},
    {id:"gpu_156",name:"XFX Swift RX 7600",brand:"XFX",model:"RX 7600",variantLabel:"XFX Swift",price:275,perf:27,vram:8,tdp:165,len:250},
    {id:"gpu_157",name:"ASRock Challenger RX 7600",brand:"ASRock",model:"RX 7600",variantLabel:"ASRock Challenger",price:280,perf:27,vram:8,tdp:165,len:253},
    {id:"gpu_158",name:"Acer Nitro RX 7600",brand:"Acer",model:"RX 7600",variantLabel:"Acer Nitro",price:285,perf:27,vram:8,tdp:165,len:255},
    {id:"gpu_159",name:"Gigabyte Gaming OC RX 7600",brand:"Gigabyte",model:"RX 7600",variantLabel:"Gigabyte Gaming OC",price:285,perf:27,vram:8,tdp:165,len:260},
    {id:"gpu_160",name:"Sapphire Pulse RX 7600",brand:"Sapphire",model:"RX 7600",variantLabel:"Sapphire Pulse",price:290,perf:27,vram:8,tdp:165,len:257},
    {id:"gpu_161",name:"PowerColor Reaper RX 7600 XT",brand:"PowerColor",model:"RX 7600 XT",variantLabel:"PowerColor Reaper",price:330,perf:28,vram:16,tdp:190,len:250},
    {id:"gpu_162",name:"XFX Swift RX 7600 XT",brand:"XFX",model:"RX 7600 XT",variantLabel:"XFX Swift",price:335,perf:28,vram:16,tdp:190,len:255},
    {id:"gpu_163",name:"ASRock Challenger RX 7600 XT",brand:"ASRock",model:"RX 7600 XT",variantLabel:"ASRock Challenger",price:345,perf:28,vram:16,tdp:190,len:258},
    {id:"gpu_164",name:"Acer Nitro RX 7600 XT",brand:"Acer",model:"RX 7600 XT",variantLabel:"Acer Nitro",price:345,perf:28,vram:16,tdp:190,len:260},
    {id:"gpu_165",name:"Gigabyte Gaming OC RX 7600 XT",brand:"Gigabyte",model:"RX 7600 XT",variantLabel:"Gigabyte Gaming OC",price:350,perf:28,vram:16,tdp:190,len:265},
    {id:"gpu_166",name:"Sapphire Pulse RX 7600 XT",brand:"Sapphire",model:"RX 7600 XT",variantLabel:"Sapphire Pulse",price:355,perf:28,vram:16,tdp:190,len:262},
    {id:"gpu_167",name:"PowerColor Reaper RX 7700 XT",brand:"PowerColor",model:"RX 7700 XT",variantLabel:"PowerColor Reaper",price:430,perf:37,vram:12,tdp:245,len:280},
    {id:"gpu_168",name:"XFX Swift RX 7700 XT",brand:"XFX",model:"RX 7700 XT",variantLabel:"XFX Swift",price:440,perf:37,vram:12,tdp:245,len:285},
    {id:"gpu_169",name:"ASRock Challenger RX 7700 XT",brand:"ASRock",model:"RX 7700 XT",variantLabel:"ASRock Challenger",price:445,perf:37,vram:12,tdp:245,len:288},
    {id:"gpu_170",name:"Acer Nitro RX 7700 XT",brand:"Acer",model:"RX 7700 XT",variantLabel:"Acer Nitro",price:450,perf:37,vram:12,tdp:245,len:290},
    {id:"gpu_171",name:"Gigabyte Gaming OC RX 7700 XT",brand:"Gigabyte",model:"RX 7700 XT",variantLabel:"Gigabyte Gaming OC",price:455,perf:37,vram:12,tdp:245,len:295},
    {id:"gpu_172",name:"Sapphire Pulse RX 7700 XT",brand:"Sapphire",model:"RX 7700 XT",variantLabel:"Sapphire Pulse",price:460,perf:37,vram:12,tdp:245,len:292},
    {id:"gpu_173",name:"PowerColor Hellhound RX 7700 XT",brand:"PowerColor",model:"RX 7700 XT",variantLabel:"PowerColor Hellhound",price:475,perf:37,vram:12,tdp:245,len:300},
    {id:"gpu_174",name:"PowerColor Reaper RX 7800 XT",brand:"PowerColor",model:"RX 7800 XT",variantLabel:"PowerColor Reaper",price:500,perf:42,vram:16,tdp:263,len:285},
    {id:"gpu_175",name:"XFX Swift RX 7800 XT",brand:"XFX",model:"RX 7800 XT",variantLabel:"XFX Swift",price:510,perf:42,vram:16,tdp:263,len:290},
    {id:"gpu_176",name:"ASRock Challenger RX 7800 XT",brand:"ASRock",model:"RX 7800 XT",variantLabel:"ASRock Challenger",price:520,perf:42,vram:16,tdp:263,len:293},
    {id:"gpu_177",name:"Acer Nitro RX 7800 XT",brand:"Acer",model:"RX 7800 XT",variantLabel:"Acer Nitro",price:525,perf:42,vram:16,tdp:263,len:295},
    {id:"gpu_178",name:"Gigabyte Gaming OC RX 7800 XT",brand:"Gigabyte",model:"RX 7800 XT",variantLabel:"Gigabyte Gaming OC",price:530,perf:42,vram:16,tdp:263,len:300},
    {id:"gpu_179",name:"Sapphire Pulse RX 7800 XT",brand:"Sapphire",model:"RX 7800 XT",variantLabel:"Sapphire Pulse",price:535,perf:42,vram:16,tdp:263,len:297},
    {id:"gpu_180",name:"PowerColor Hellhound RX 7800 XT",brand:"PowerColor",model:"RX 7800 XT",variantLabel:"PowerColor Hellhound",price:550,perf:42,vram:16,tdp:263,len:305},
    {id:"gpu_181",name:"XFX Merc 310 RX 7800 XT",brand:"XFX",model:"RX 7800 XT",variantLabel:"XFX Merc 310",price:570,perf:42,vram:16,tdp:263,len:315},
    {id:"gpu_182",name:"PowerColor Reaper RX 7900 GRE",brand:"PowerColor",model:"RX 7900 GRE",variantLabel:"PowerColor Reaper",price:550,perf:45,vram:16,tdp:260,len:285},
    {id:"gpu_183",name:"XFX Swift RX 7900 GRE",brand:"XFX",model:"RX 7900 GRE",variantLabel:"XFX Swift",price:560,perf:45,vram:16,tdp:260,len:290},
    {id:"gpu_184",name:"ASRock Challenger RX 7900 GRE",brand:"ASRock",model:"RX 7900 GRE",variantLabel:"ASRock Challenger",price:570,perf:45,vram:16,tdp:260,len:293},
    {id:"gpu_185",name:"Acer Nitro RX 7900 GRE",brand:"Acer",model:"RX 7900 GRE",variantLabel:"Acer Nitro",price:580,perf:45,vram:16,tdp:260,len:295},
    {id:"gpu_186",name:"Gigabyte Gaming OC RX 7900 GRE",brand:"Gigabyte",model:"RX 7900 GRE",variantLabel:"Gigabyte Gaming OC",price:585,perf:45,vram:16,tdp:260,len:300},
    {id:"gpu_187",name:"Sapphire Pulse RX 7900 GRE",brand:"Sapphire",model:"RX 7900 GRE",variantLabel:"Sapphire Pulse",price:590,perf:45,vram:16,tdp:260,len:297},
    {id:"gpu_188",name:"PowerColor Reaper RX 7900 XT",brand:"PowerColor",model:"RX 7900 XT",variantLabel:"PowerColor Reaper",price:680,perf:48,vram:20,tdp:315,len:300},
    {id:"gpu_189",name:"XFX Swift RX 7900 XT",brand:"XFX",model:"RX 7900 XT",variantLabel:"XFX Swift",price:695,perf:48,vram:20,tdp:315,len:305},
    {id:"gpu_190",name:"ASRock Challenger RX 7900 XT",brand:"ASRock",model:"RX 7900 XT",variantLabel:"ASRock Challenger",price:705,perf:48,vram:20,tdp:315,len:308},
    {id:"gpu_191",name:"Acer Nitro RX 7900 XT",brand:"Acer",model:"RX 7900 XT",variantLabel:"Acer Nitro",price:715,perf:48,vram:20,tdp:315,len:310},
    {id:"gpu_192",name:"Gigabyte Gaming OC RX 7900 XT",brand:"Gigabyte",model:"RX 7900 XT",variantLabel:"Gigabyte Gaming OC",price:720,perf:48,vram:20,tdp:315,len:315},
    {id:"gpu_193",name:"Sapphire Pulse RX 7900 XT",brand:"Sapphire",model:"RX 7900 XT",variantLabel:"Sapphire Pulse",price:730,perf:48,vram:20,tdp:315,len:312},
    {id:"gpu_194",name:"PowerColor Hellhound RX 7900 XT",brand:"PowerColor",model:"RX 7900 XT",variantLabel:"PowerColor Hellhound",price:750,perf:48,vram:20,tdp:315,len:320},
    {id:"gpu_195",name:"PowerColor Reaper RX 7900 XTX",brand:"PowerColor",model:"RX 7900 XTX",variantLabel:"PowerColor Reaper",price:900,perf:58,vram:24,tdp:355,len:320},
    {id:"gpu_196",name:"XFX Swift RX 7900 XTX",brand:"XFX",model:"RX 7900 XTX",variantLabel:"XFX Swift",price:920,perf:58,vram:24,tdp:355,len:325},
    {id:"gpu_197",name:"ASRock Challenger RX 7900 XTX",brand:"ASRock",model:"RX 7900 XTX",variantLabel:"ASRock Challenger",price:935,perf:58,vram:24,tdp:355,len:328},
    {id:"gpu_198",name:"Acer Nitro RX 7900 XTX",brand:"Acer",model:"RX 7900 XTX",variantLabel:"Acer Nitro",price:945,perf:58,vram:24,tdp:355,len:330},
    {id:"gpu_199",name:"Gigabyte Gaming OC RX 7900 XTX",brand:"Gigabyte",model:"RX 7900 XTX",variantLabel:"Gigabyte Gaming OC",price:955,perf:58,vram:24,tdp:355,len:335},
    {id:"gpu_200",name:"Sapphire Pulse RX 7900 XTX",brand:"Sapphire",model:"RX 7900 XTX",variantLabel:"Sapphire Pulse",price:965,perf:58,vram:24,tdp:355,len:332},
    {id:"gpu_201",name:"PowerColor Hellhound RX 7900 XTX",brand:"PowerColor",model:"RX 7900 XTX",variantLabel:"PowerColor Hellhound",price:990,perf:58,vram:24,tdp:355,len:340},
    {id:"gpu_202",name:"PowerColor Reaper RX 9060 XT 8GB",brand:"PowerColor",model:"RX 9060 XT 8GB",variantLabel:"PowerColor Reaper",price:330,perf:35,vram:8,tdp:150,len:240},
    {id:"gpu_203",name:"XFX Swift RX 9060 XT 8GB",brand:"XFX",model:"RX 9060 XT 8GB",variantLabel:"XFX Swift",price:335,perf:35,vram:8,tdp:150,len:245},
    {id:"gpu_204",name:"ASRock Challenger RX 9060 XT 8GB",brand:"ASRock",model:"RX 9060 XT 8GB",variantLabel:"ASRock Challenger",price:345,perf:35,vram:8,tdp:150,len:248},
    {id:"gpu_205",name:"Acer Nitro RX 9060 XT 8GB",brand:"Acer",model:"RX 9060 XT 8GB",variantLabel:"Acer Nitro",price:345,perf:35,vram:8,tdp:150,len:250},
    {id:"gpu_206",name:"Gigabyte Gaming OC RX 9060 XT 8GB",brand:"Gigabyte",model:"RX 9060 XT 8GB",variantLabel:"Gigabyte Gaming OC",price:350,perf:35,vram:8,tdp:150,len:255},
    {id:"gpu_207",name:"Sapphire Pulse RX 9060 XT 8GB",brand:"Sapphire",model:"RX 9060 XT 8GB",variantLabel:"Sapphire Pulse",price:355,perf:35,vram:8,tdp:150,len:252},
    {id:"gpu_208",name:"PowerColor Reaper RX 9060 XT 16GB",brand:"PowerColor",model:"RX 9060 XT 16GB",variantLabel:"PowerColor Reaper",price:360,perf:37,vram:16,tdp:160,len:245},
    {id:"gpu_209",name:"XFX Swift RX 9060 XT 16GB",brand:"XFX",model:"RX 9060 XT 16GB",variantLabel:"XFX Swift",price:365,perf:37,vram:16,tdp:160,len:250},
    {id:"gpu_210",name:"ASRock Challenger RX 9060 XT 16GB",brand:"ASRock",model:"RX 9060 XT 16GB",variantLabel:"ASRock Challenger",price:375,perf:37,vram:16,tdp:160,len:253},
    {id:"gpu_211",name:"Acer Nitro RX 9060 XT 16GB",brand:"Acer",model:"RX 9060 XT 16GB",variantLabel:"Acer Nitro",price:380,perf:37,vram:16,tdp:160,len:255},
    {id:"gpu_212",name:"Gigabyte Gaming OC RX 9060 XT 16GB",brand:"Gigabyte",model:"RX 9060 XT 16GB",variantLabel:"Gigabyte Gaming OC",price:380,perf:37,vram:16,tdp:160,len:260},
    {id:"gpu_213",name:"Sapphire Pulse RX 9060 XT 16GB",brand:"Sapphire",model:"RX 9060 XT 16GB",variantLabel:"Sapphire Pulse",price:385,perf:37,vram:16,tdp:160,len:257},
    {id:"gpu_214",name:"PowerColor Hellhound RX 9060 XT 16GB",brand:"PowerColor",model:"RX 9060 XT 16GB",variantLabel:"PowerColor Hellhound",price:395,perf:37,vram:16,tdp:160,len:265},
    {id:"gpu_215",name:"XFX Merc 310 RX 9060 XT 16GB",brand:"XFX",model:"RX 9060 XT 16GB",variantLabel:"XFX Merc 310",price:410,perf:37,vram:16,tdp:160,len:275},
    {id:"gpu_216",name:"ASUS TUF OC RX 9060 XT 16GB",brand:"ASUS",model:"RX 9060 XT 16GB",variantLabel:"ASUS TUF OC",price:415,perf:37,vram:16,tdp:160,len:275},
    {id:"gpu_217",name:"PowerColor Reaper RX 9070",brand:"PowerColor",model:"RX 9070",variantLabel:"PowerColor Reaper",price:600,perf:49,vram:16,tdp:220,len:280},
    {id:"gpu_218",name:"XFX Swift RX 9070",brand:"XFX",model:"RX 9070",variantLabel:"XFX Swift",price:610,perf:49,vram:16,tdp:220,len:285},
    {id:"gpu_219",name:"ASRock Challenger RX 9070",brand:"ASRock",model:"RX 9070",variantLabel:"ASRock Challenger",price:625,perf:49,vram:16,tdp:220,len:288},
    {id:"gpu_220",name:"Acer Nitro RX 9070",brand:"Acer",model:"RX 9070",variantLabel:"Acer Nitro",price:630,perf:49,vram:16,tdp:220,len:290},
    {id:"gpu_221",name:"Gigabyte Gaming OC RX 9070",brand:"Gigabyte",model:"RX 9070",variantLabel:"Gigabyte Gaming OC",price:635,perf:49,vram:16,tdp:220,len:295},
    {id:"gpu_222",name:"Sapphire Pulse RX 9070",brand:"Sapphire",model:"RX 9070",variantLabel:"Sapphire Pulse",price:640,perf:49,vram:16,tdp:220,len:292},
    {id:"gpu_223",name:"PowerColor Hellhound RX 9070",brand:"PowerColor",model:"RX 9070",variantLabel:"PowerColor Hellhound",price:660,perf:49,vram:16,tdp:220,len:300},
    {id:"gpu_224",name:"XFX Merc 310 RX 9070",brand:"XFX",model:"RX 9070",variantLabel:"XFX Merc 310",price:685,perf:49,vram:16,tdp:220,len:310},
    {id:"gpu_225",name:"ASUS TUF OC RX 9070",brand:"ASUS",model:"RX 9070",variantLabel:"ASUS TUF OC",price:690,perf:49,vram:16,tdp:220,len:310},
    {id:"gpu_226",name:"PowerColor Reaper RX 9070 XT",brand:"PowerColor",model:"RX 9070 XT",variantLabel:"PowerColor Reaper",price:710,perf:54,vram:16,tdp:304,len:290},
    {id:"gpu_227",name:"XFX Swift RX 9070 XT",brand:"XFX",model:"RX 9070 XT",variantLabel:"XFX Swift",price:725,perf:54,vram:16,tdp:304,len:295},
    {id:"gpu_228",name:"ASRock Challenger RX 9070 XT",brand:"ASRock",model:"RX 9070 XT",variantLabel:"ASRock Challenger",price:740,perf:54,vram:16,tdp:304,len:298},
    {id:"gpu_229",name:"Acer Nitro RX 9070 XT",brand:"Acer",model:"RX 9070 XT",variantLabel:"Acer Nitro",price:745,perf:54,vram:16,tdp:304,len:300},
    {id:"gpu_230",name:"Gigabyte Gaming OC RX 9070 XT",brand:"Gigabyte",model:"RX 9070 XT",variantLabel:"Gigabyte Gaming OC",price:755,perf:54,vram:16,tdp:304,len:305},
    {id:"gpu_231",name:"Sapphire Pulse RX 9070 XT",brand:"Sapphire",model:"RX 9070 XT",variantLabel:"Sapphire Pulse",price:760,perf:54,vram:16,tdp:304,len:302},
    {id:"gpu_232",name:"PowerColor Hellhound RX 9070 XT",brand:"PowerColor",model:"RX 9070 XT",variantLabel:"PowerColor Hellhound",price:780,perf:54,vram:16,tdp:304,len:310},
    {id:"gpu_233",name:"XFX Merc 310 RX 9070 XT",brand:"XFX",model:"RX 9070 XT",variantLabel:"XFX Merc 310",price:810,perf:54,vram:16,tdp:304,len:320},
    {id:"gpu_234",name:"ASUS TUF OC RX 9070 XT",brand:"ASUS",model:"RX 9070 XT",variantLabel:"ASUS TUF OC",price:815,perf:54,vram:16,tdp:304,len:320},
    {id:"gpu_235",name:"PowerColor Red Devil RX 9070 XT",brand:"PowerColor",model:"RX 9070 XT",variantLabel:"PowerColor Red Devil",price:830,perf:54,vram:16,tdp:304,len:322},
    {id:"gpu_236",name:"Sapphire Nitro+ RX 9070 XT",brand:"Sapphire",model:"RX 9070 XT",variantLabel:"Sapphire Nitro+",price:845,perf:54,vram:16,tdp:304,len:325},
    {id:"gpu_237",name:"ASRock Taichi RX 9070 XT",brand:"ASRock",model:"RX 9070 XT",variantLabel:"ASRock Taichi",price:860,perf:54,vram:16,tdp:304,len:325},
  ],
  mobo: [
    {id:"mb1",brand:"MSI",name:"MSI B450 Tomahawk Max II",model:"MSI B450 Tomahawk Max II",variantLabel:"MSI",price:90,perf:46,socket:"AM4",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb2",brand:"ASRock",name:"ASRock B550 Pro RS",model:"ASRock B550 Pro RS",variantLabel:"ASRock",price:115,perf:54,socket:"AM4",ramType:"DDR4",form:"mATX",m2:2,maxRam:128},
    {id:"mb3",brand:"MSI",name:"MSI B550 Tomahawk",model:"MSI B550 Tomahawk",variantLabel:"MSI",price:130,perf:54,socket:"AM4",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb4",brand:"ASUS",name:"ASUS B550 TUF Gaming Plus",model:"ASUS B550 TUF Gaming Plus",variantLabel:"ASUS",price:130,perf:54,socket:"AM4",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb5",brand:"Gigabyte",name:"Gigabyte X570 Aorus Elite",model:"Gigabyte X570 Aorus Elite",variantLabel:"Gigabyte",price:180,perf:62,socket:"AM4",ramType:"DDR4",form:"ATX",m2:3,maxRam:128},
    {id:"mb6",brand:"ASUS",name:"ASUS H510 Prime M-E",model:"ASUS H510 Prime M-E",variantLabel:"ASUS",price:70,perf:42,socket:"LGA1200",ramType:"DDR4",form:"mATX",m2:2,maxRam:128},
    {id:"mb7",brand:"MSI",name:"MSI B560 Tomahawk WiFi",model:"MSI B560 Tomahawk WiFi",variantLabel:"MSI",price:110,perf:52,socket:"LGA1200",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb8",brand:"Gigabyte",name:"Gigabyte B560 DS3H",model:"Gigabyte B560 DS3H",variantLabel:"Gigabyte",price:110,perf:52,socket:"LGA1200",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb9",brand:"ASRock",name:"ASRock B560 Steel Legend",model:"ASRock B560 Steel Legend",variantLabel:"ASRock",price:110,perf:52,socket:"LGA1200",ramType:"DDR4",form:"ATX",m2:2,maxRam:128},
    {id:"mb10",brand:"ASRock",name:"ASRock B650 PG Lightning",model:"ASRock B650 PG Lightning",variantLabel:"ASRock",price:150,perf:58,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb11",brand:"MSI",name:"MSI B650 Gaming Plus WiFi",model:"MSI B650 Gaming Plus WiFi",variantLabel:"MSI",price:150,perf:58,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb12",brand:"ASUS",name:"ASUS B650 TUF Gaming Plus",model:"ASUS B650 TUF Gaming Plus",variantLabel:"ASUS",price:150,perf:58,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb13",brand:"Gigabyte",name:"Gigabyte B650 Aorus Elite AX",model:"Gigabyte B650 Aorus Elite AX",variantLabel:"Gigabyte",price:150,perf:58,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb14",brand:"ASRock",name:"ASRock B650E Taichi Lite",model:"ASRock B650E Taichi Lite",variantLabel:"ASRock",price:200,perf:66,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb15",brand:"MSI",name:"MSI B850 Tomahawk",model:"MSI B850 Tomahawk",variantLabel:"MSI",price:200,perf:66,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb16",brand:"ASUS",name:"ASUS B850 TUF Gaming Plus",model:"ASUS B850 TUF Gaming Plus",variantLabel:"ASUS",price:200,perf:66,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb17",brand:"Gigabyte",name:"Gigabyte B850 Aorus Elite",model:"Gigabyte B850 Aorus Elite",variantLabel:"Gigabyte",price:200,perf:66,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb18",brand:"ASRock",name:"ASRock B850 Steel Legend",model:"ASRock B850 Steel Legend",variantLabel:"ASRock",price:200,perf:66,socket:"AM5",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb19",brand:"Gigabyte",name:"Gigabyte X670E Aorus Master",model:"Gigabyte X670E Aorus Master",variantLabel:"Gigabyte",price:330,perf:80,socket:"AM5",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb20",brand:"ASUS",name:"ASUS X870 ROG Strix-A",model:"ASUS X870 ROG Strix-A",variantLabel:"ASUS",price:260,perf:76,socket:"AM5",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb21",brand:"MSI",name:"MSI X870 Tomahawk WiFi",model:"MSI X870 Tomahawk WiFi",variantLabel:"MSI",price:260,perf:76,socket:"AM5",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb22",brand:"Gigabyte",name:"Gigabyte X870E Aorus Master",model:"Gigabyte X870E Aorus Master",variantLabel:"Gigabyte",price:430,perf:86,socket:"AM5",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb23",brand:"ASUS",name:"ASUS X870E ROG Hero",model:"ASUS X870E ROG Hero",variantLabel:"ASUS",price:430,perf:86,socket:"AM5",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb24",brand:"MSI",name:"MSI B760 Gaming Plus WiFi",model:"MSI B760 Gaming Plus WiFi",variantLabel:"MSI",price:150,perf:56,socket:"LGA1700",ramType:"DDR5",form:"ATX",m2:2,maxRam:192},
    {id:"mb25",brand:"Gigabyte",name:"Gigabyte B760 DS3H",model:"Gigabyte B760 DS3H",variantLabel:"Gigabyte",price:150,perf:56,socket:"LGA1700",ramType:"DDR5",form:"ATX",m2:2,maxRam:192},
    {id:"mb26",brand:"ASUS",name:"ASUS Z790 ROG Strix-F",model:"ASUS Z790 ROG Strix-F",variantLabel:"ASUS",price:300,perf:78,socket:"LGA1700",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb27",brand:"MSI",name:"MSI Z790 Tomahawk",model:"MSI Z790 Tomahawk",variantLabel:"MSI",price:300,perf:78,socket:"LGA1700",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb28",brand:"MSI",name:"MSI B860 Tomahawk WiFi",model:"MSI B860 Tomahawk WiFi",variantLabel:"MSI",price:200,perf:64,socket:"LGA1851",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb29",brand:"ASUS",name:"ASUS B860 TUF Gaming Plus",model:"ASUS B860 TUF Gaming Plus",variantLabel:"ASUS",price:200,perf:64,socket:"LGA1851",ramType:"DDR5",form:"ATX",m2:3,maxRam:192},
    {id:"mb30",brand:"Gigabyte",name:"Gigabyte Z890 Aorus Elite",model:"Gigabyte Z890 Aorus Elite",variantLabel:"Gigabyte",price:360,perf:84,socket:"LGA1851",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb31",brand:"ASUS",name:"ASUS Z890 ROG Strix-E",model:"ASUS Z890 ROG Strix-E",variantLabel:"ASUS",price:360,perf:84,socket:"LGA1851",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb32",brand:"MSI",name:"MSI Z890 MEG Ace",model:"MSI Z890 MEG Ace",variantLabel:"MSI",price:360,perf:84,socket:"LGA1851",ramType:"DDR5",form:"ATX",m2:4,maxRam:256},
    {id:"mb33",brand:"ASRock",name:"ASRock B650 ITX",model:"ASRock B650 ITX",variantLabel:"ASRock",price:175,perf:60,socket:"AM5",ramType:"DDR5",form:"ITX",m2:2,maxRam:96},
    {id:"mb34",brand:"ASUS",name:"ASUS B850 ROG Strix-I ITX",model:"ASUS B850 ROG Strix-I ITX",variantLabel:"ASUS",price:230,perf:68,socket:"AM5",ramType:"DDR5",form:"ITX",m2:2,maxRam:96},
    {id:"mb35",brand:"Gigabyte",name:"Gigabyte Z890 Aorus ITX",model:"Gigabyte Z890 Aorus ITX",variantLabel:"Gigabyte",price:415,perf:86,socket:"LGA1851",ramType:"DDR5",form:"ITX",m2:2,maxRam:96},
    {id:"mb36",brand:"MSI",name:"MSI B760M Mortar mATX",model:"MSI B760M Mortar mATX",variantLabel:"MSI",price:135,perf:56,socket:"LGA1700",ramType:"DDR5",form:"mATX",m2:2,maxRam:192},
    {id:"mb37",brand:"ASRock",name:"ASRock B860M Pro mATX",model:"ASRock B860M Pro mATX",variantLabel:"ASRock",price:180,perf:64,socket:"LGA1851",ramType:"DDR5",form:"mATX",m2:3,maxRam:192},
    {id:"mb38",brand:"ASRock",name:"ASRock B550M ITX",model:"ASRock B550M ITX",variantLabel:"ASRock",price:150,perf:56,socket:"AM4",ramType:"DDR4",form:"ITX",m2:2,maxRam:96},
  ],
  ram: [
    {id:"ram1",brand:"Corsair",name:"Corsair Vengeance LPX 16GB DDR4-3200",model:"Corsair Vengeance LPX 16GB DDR4-3200",variantLabel:"Corsair",price:90,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram2",brand:"G.Skill",name:"G.Skill Ripjaws V 16GB DDR4-3200",model:"G.Skill Ripjaws V 16GB DDR4-3200",variantLabel:"G.Skill",price:90,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram3",brand:"Kingston",name:"Kingston Fury Beast 16GB DDR4-3200",model:"Kingston Fury Beast 16GB DDR4-3200",variantLabel:"Kingston",price:95,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram4",brand:"TeamGroup",name:"TeamGroup T-Force Vulcan 16GB DDR4-3200",model:"TeamGroup T-Force Vulcan 16GB DDR4-3200",variantLabel:"TeamGroup",price:95,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram5",brand:"Patriot",name:"Patriot Viper Steel 16GB DDR4-3200",model:"Patriot Viper Steel 16GB DDR4-3200",variantLabel:"Patriot",price:95,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram6",brand:"ADATA",name:"ADATA XPG Gammix 16GB DDR4-3200",model:"ADATA XPG Gammix 16GB DDR4-3200",variantLabel:"ADATA",price:100,perf:41,ramType:"DDR4",cap:16,speed:3200},
    {id:"ram7",brand:"Corsair",name:"Corsair Vengeance LPX 16GB DDR4-3600",model:"Corsair Vengeance LPX 16GB DDR4-3600",variantLabel:"Corsair",price:100,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram8",brand:"G.Skill",name:"G.Skill Ripjaws V 16GB DDR4-3600",model:"G.Skill Ripjaws V 16GB DDR4-3600",variantLabel:"G.Skill",price:100,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram9",brand:"Kingston",name:"Kingston Fury Beast 16GB DDR4-3600",model:"Kingston Fury Beast 16GB DDR4-3600",variantLabel:"Kingston",price:105,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram10",brand:"TeamGroup",name:"TeamGroup T-Force Vulcan 16GB DDR4-3600",model:"TeamGroup T-Force Vulcan 16GB DDR4-3600",variantLabel:"TeamGroup",price:105,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram11",brand:"Patriot",name:"Patriot Viper Steel 16GB DDR4-3600",model:"Patriot Viper Steel 16GB DDR4-3600",variantLabel:"Patriot",price:110,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram12",brand:"ADATA",name:"ADATA XPG Gammix 16GB DDR4-3600",model:"ADATA XPG Gammix 16GB DDR4-3600",variantLabel:"ADATA",price:110,perf:41,ramType:"DDR4",cap:16,speed:3600},
    {id:"ram13",brand:"Corsair",name:"Corsair Vengeance LPX 32GB DDR4-3200",model:"Corsair Vengeance LPX 32GB DDR4-3200",variantLabel:"Corsair",price:150,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram14",brand:"G.Skill",name:"G.Skill Ripjaws V 32GB DDR4-3200",model:"G.Skill Ripjaws V 32GB DDR4-3200",variantLabel:"G.Skill",price:155,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram15",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR4-3200",model:"Kingston Fury Beast 32GB DDR4-3200",variantLabel:"Kingston",price:155,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram16",brand:"TeamGroup",name:"TeamGroup T-Force Vulcan 32GB DDR4-3200",model:"TeamGroup T-Force Vulcan 32GB DDR4-3200",variantLabel:"TeamGroup",price:160,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram17",brand:"Patriot",name:"Patriot Viper Steel 32GB DDR4-3200",model:"Patriot Viper Steel 32GB DDR4-3200",variantLabel:"Patriot",price:160,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram18",brand:"ADATA",name:"ADATA XPG Gammix 32GB DDR4-3200",model:"ADATA XPG Gammix 32GB DDR4-3200",variantLabel:"ADATA",price:165,perf:65,ramType:"DDR4",cap:32,speed:3200},
    {id:"ram19",brand:"Corsair",name:"Corsair Vengeance LPX 32GB DDR4-3600",model:"Corsair Vengeance LPX 32GB DDR4-3600",variantLabel:"Corsair",price:165,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram20",brand:"G.Skill",name:"G.Skill Ripjaws V 32GB DDR4-3600",model:"G.Skill Ripjaws V 32GB DDR4-3600",variantLabel:"G.Skill",price:170,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram21",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR4-3600",model:"Kingston Fury Beast 32GB DDR4-3600",variantLabel:"Kingston",price:170,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram22",brand:"TeamGroup",name:"TeamGroup T-Force Vulcan 32GB DDR4-3600",model:"TeamGroup T-Force Vulcan 32GB DDR4-3600",variantLabel:"TeamGroup",price:175,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram23",brand:"Patriot",name:"Patriot Viper Steel 32GB DDR4-3600",model:"Patriot Viper Steel 32GB DDR4-3600",variantLabel:"Patriot",price:180,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram24",brand:"ADATA",name:"ADATA XPG Gammix 32GB DDR4-3600",model:"ADATA XPG Gammix 32GB DDR4-3600",variantLabel:"ADATA",price:180,perf:65,ramType:"DDR4",cap:32,speed:3600},
    {id:"ram25",brand:"Corsair",name:"Corsair Vengeance 16GB DDR5-5600",model:"Corsair Vengeance 16GB DDR5-5600",variantLabel:"Corsair",price:180,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram26",brand:"G.Skill",name:"G.Skill Flare X5 16GB DDR5-5600",model:"G.Skill Flare X5 16GB DDR5-5600",variantLabel:"G.Skill",price:185,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram27",brand:"G.Skill",name:"G.Skill Trident Z5 16GB DDR5-5600",model:"G.Skill Trident Z5 16GB DDR5-5600",variantLabel:"G.Skill",price:185,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram28",brand:"Kingston",name:"Kingston Fury Beast 16GB DDR5-5600",model:"Kingston Fury Beast 16GB DDR5-5600",variantLabel:"Kingston",price:190,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram29",brand:"TeamGroup",name:"TeamGroup T-Force Delta 16GB DDR5-5600",model:"TeamGroup T-Force Delta 16GB DDR5-5600",variantLabel:"TeamGroup",price:195,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram30",brand:"Crucial",name:"Crucial Pro 16GB DDR5-5600",model:"Crucial Pro 16GB DDR5-5600",variantLabel:"Crucial",price:200,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram31",brand:"ADATA",name:"ADATA XPG Lancer 16GB DDR5-5600",model:"ADATA XPG Lancer 16GB DDR5-5600",variantLabel:"ADATA",price:200,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram32",brand:"Patriot",name:"Patriot Viper Venom 16GB DDR5-5600",model:"Patriot Viper Venom 16GB DDR5-5600",variantLabel:"Patriot",price:205,perf:50,ramType:"DDR5",cap:16,speed:5600},
    {id:"ram33",brand:"Corsair",name:"Corsair Vengeance 16GB DDR5-6000",model:"Corsair Vengeance 16GB DDR5-6000",variantLabel:"Corsair",price:190,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram34",brand:"G.Skill",name:"G.Skill Flare X5 16GB DDR5-6000",model:"G.Skill Flare X5 16GB DDR5-6000",variantLabel:"G.Skill",price:195,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram35",brand:"G.Skill",name:"G.Skill Trident Z5 16GB DDR5-6000",model:"G.Skill Trident Z5 16GB DDR5-6000",variantLabel:"G.Skill",price:200,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram36",brand:"Kingston",name:"Kingston Fury Beast 16GB DDR5-6000",model:"Kingston Fury Beast 16GB DDR5-6000",variantLabel:"Kingston",price:200,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram37",brand:"TeamGroup",name:"TeamGroup T-Force Delta 16GB DDR5-6000",model:"TeamGroup T-Force Delta 16GB DDR5-6000",variantLabel:"TeamGroup",price:205,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram38",brand:"Crucial",name:"Crucial Pro 16GB DDR5-6000",model:"Crucial Pro 16GB DDR5-6000",variantLabel:"Crucial",price:210,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram39",brand:"ADATA",name:"ADATA XPG Lancer 16GB DDR5-6000",model:"ADATA XPG Lancer 16GB DDR5-6000",variantLabel:"ADATA",price:215,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram40",brand:"Patriot",name:"Patriot Viper Venom 16GB DDR5-6000",model:"Patriot Viper Venom 16GB DDR5-6000",variantLabel:"Patriot",price:215,perf:53,ramType:"DDR5",cap:16,speed:6000},
    {id:"ram41",brand:"Corsair",name:"Corsair Vengeance 32GB DDR5-5600",model:"Corsair Vengeance 32GB DDR5-5600",variantLabel:"Corsair",price:450,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram42",brand:"G.Skill",name:"G.Skill Flare X5 32GB DDR5-5600",model:"G.Skill Flare X5 32GB DDR5-5600",variantLabel:"G.Skill",price:460,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram43",brand:"G.Skill",name:"G.Skill Trident Z5 32GB DDR5-5600",model:"G.Skill Trident Z5 32GB DDR5-5600",variantLabel:"G.Skill",price:470,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram44",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR5-5600",model:"Kingston Fury Beast 32GB DDR5-5600",variantLabel:"Kingston",price:475,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram45",brand:"TeamGroup",name:"TeamGroup T-Force Delta 32GB DDR5-5600",model:"TeamGroup T-Force Delta 32GB DDR5-5600",variantLabel:"TeamGroup",price:485,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram46",brand:"Crucial",name:"Crucial Pro 32GB DDR5-5600",model:"Crucial Pro 32GB DDR5-5600",variantLabel:"Crucial",price:495,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram47",brand:"ADATA",name:"ADATA XPG Lancer 32GB DDR5-5600",model:"ADATA XPG Lancer 32GB DDR5-5600",variantLabel:"ADATA",price:505,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram48",brand:"Patriot",name:"Patriot Viper Venom 32GB DDR5-5600",model:"Patriot Viper Venom 32GB DDR5-5600",variantLabel:"Patriot",price:515,perf:74,ramType:"DDR5",cap:32,speed:5600},
    {id:"ram49",brand:"Corsair",name:"Corsair Vengeance 32GB DDR5-6000",model:"Corsair Vengeance 32GB DDR5-6000",variantLabel:"Corsair",price:470,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram50",brand:"G.Skill",name:"G.Skill Flare X5 32GB DDR5-6000",model:"G.Skill Flare X5 32GB DDR5-6000",variantLabel:"G.Skill",price:480,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram51",brand:"G.Skill",name:"G.Skill Trident Z5 32GB DDR5-6000",model:"G.Skill Trident Z5 32GB DDR5-6000",variantLabel:"G.Skill",price:490,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram52",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR5-6000",model:"Kingston Fury Beast 32GB DDR5-6000",variantLabel:"Kingston",price:500,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram53",brand:"TeamGroup",name:"TeamGroup T-Force Delta 32GB DDR5-6000",model:"TeamGroup T-Force Delta 32GB DDR5-6000",variantLabel:"TeamGroup",price:510,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram54",brand:"Crucial",name:"Crucial Pro 32GB DDR5-6000",model:"Crucial Pro 32GB DDR5-6000",variantLabel:"Crucial",price:515,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram55",brand:"ADATA",name:"ADATA XPG Lancer 32GB DDR5-6000",model:"ADATA XPG Lancer 32GB DDR5-6000",variantLabel:"ADATA",price:525,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram56",brand:"Patriot",name:"Patriot Viper Venom 32GB DDR5-6000",model:"Patriot Viper Venom 32GB DDR5-6000",variantLabel:"Patriot",price:535,perf:77,ramType:"DDR5",cap:32,speed:6000},
    {id:"ram57",brand:"Corsair",name:"Corsair Vengeance 32GB DDR5-6400",model:"Corsair Vengeance 32GB DDR5-6400",variantLabel:"Corsair",price:520,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram58",brand:"G.Skill",name:"G.Skill Flare X5 32GB DDR5-6400",model:"G.Skill Flare X5 32GB DDR5-6400",variantLabel:"G.Skill",price:530,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram59",brand:"G.Skill",name:"G.Skill Trident Z5 32GB DDR5-6400",model:"G.Skill Trident Z5 32GB DDR5-6400",variantLabel:"G.Skill",price:540,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram60",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR5-6400",model:"Kingston Fury Beast 32GB DDR5-6400",variantLabel:"Kingston",price:550,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram61",brand:"TeamGroup",name:"TeamGroup T-Force Delta 32GB DDR5-6400",model:"TeamGroup T-Force Delta 32GB DDR5-6400",variantLabel:"TeamGroup",price:560,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram62",brand:"Crucial",name:"Crucial Pro 32GB DDR5-6400",model:"Crucial Pro 32GB DDR5-6400",variantLabel:"Crucial",price:570,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram63",brand:"ADATA",name:"ADATA XPG Lancer 32GB DDR5-6400",model:"ADATA XPG Lancer 32GB DDR5-6400",variantLabel:"ADATA",price:580,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram64",brand:"Patriot",name:"Patriot Viper Venom 32GB DDR5-6400",model:"Patriot Viper Venom 32GB DDR5-6400",variantLabel:"Patriot",price:595,perf:76,ramType:"DDR5",cap:32,speed:6400},
    {id:"ram65",brand:"Corsair",name:"Corsair Vengeance 32GB DDR5-7200",model:"Corsair Vengeance 32GB DDR5-7200",variantLabel:"Corsair",price:560,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram66",brand:"G.Skill",name:"G.Skill Flare X5 32GB DDR5-7200",model:"G.Skill Flare X5 32GB DDR5-7200",variantLabel:"G.Skill",price:570,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram67",brand:"G.Skill",name:"G.Skill Trident Z5 32GB DDR5-7200",model:"G.Skill Trident Z5 32GB DDR5-7200",variantLabel:"G.Skill",price:580,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram68",brand:"Kingston",name:"Kingston Fury Beast 32GB DDR5-7200",model:"Kingston Fury Beast 32GB DDR5-7200",variantLabel:"Kingston",price:595,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram69",brand:"TeamGroup",name:"TeamGroup T-Force Delta 32GB DDR5-7200",model:"TeamGroup T-Force Delta 32GB DDR5-7200",variantLabel:"TeamGroup",price:605,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram70",brand:"Crucial",name:"Crucial Pro 32GB DDR5-7200",model:"Crucial Pro 32GB DDR5-7200",variantLabel:"Crucial",price:615,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram71",brand:"ADATA",name:"ADATA XPG Lancer 32GB DDR5-7200",model:"ADATA XPG Lancer 32GB DDR5-7200",variantLabel:"ADATA",price:625,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram72",brand:"Patriot",name:"Patriot Viper Venom 32GB DDR5-7200",model:"Patriot Viper Venom 32GB DDR5-7200",variantLabel:"Patriot",price:640,perf:76,ramType:"DDR5",cap:32,speed:7200},
    {id:"ram73",brand:"Corsair",name:"Corsair Vengeance 48GB DDR5-6400",model:"Corsair Vengeance 48GB DDR5-6400",variantLabel:"Corsair",price:720,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram74",brand:"G.Skill",name:"G.Skill Flare X5 48GB DDR5-6400",model:"G.Skill Flare X5 48GB DDR5-6400",variantLabel:"G.Skill",price:735,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram75",brand:"G.Skill",name:"G.Skill Trident Z5 48GB DDR5-6400",model:"G.Skill Trident Z5 48GB DDR5-6400",variantLabel:"G.Skill",price:750,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram76",brand:"Kingston",name:"Kingston Fury Beast 48GB DDR5-6400",model:"Kingston Fury Beast 48GB DDR5-6400",variantLabel:"Kingston",price:765,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram77",brand:"TeamGroup",name:"TeamGroup T-Force Delta 48GB DDR5-6400",model:"TeamGroup T-Force Delta 48GB DDR5-6400",variantLabel:"TeamGroup",price:780,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram78",brand:"Crucial",name:"Crucial Pro 48GB DDR5-6400",model:"Crucial Pro 48GB DDR5-6400",variantLabel:"Crucial",price:790,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram79",brand:"ADATA",name:"ADATA XPG Lancer 48GB DDR5-6400",model:"ADATA XPG Lancer 48GB DDR5-6400",variantLabel:"ADATA",price:805,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram80",brand:"Patriot",name:"Patriot Viper Venom 48GB DDR5-6400",model:"Patriot Viper Venom 48GB DDR5-6400",variantLabel:"Patriot",price:820,perf:82,ramType:"DDR5",cap:48,speed:6400},
    {id:"ram81",brand:"Corsair",name:"Corsair Vengeance 64GB DDR5-6000",model:"Corsair Vengeance 64GB DDR5-6000",variantLabel:"Corsair",price:850,perf:91,ramType:"DDR5",cap:64,speed:6000},
    {id:"ram82",brand:"G.Skill",name:"G.Skill Flare X5 64GB DDR5-6000",model:"G.Skill Flare X5 64GB DDR5-6000",variantLabel:"G.Skill",price:865,perf:91,ramType:"DDR5",cap:64,speed:6000},
    {id:"ram83",brand:"G.Skill",name:"G.Skill Trident Z5 64GB DDR5-6000",model:"G.Skill Trident Z5 64GB DDR5-6000",variantLabel:"G.Skill",price:885,perf:91,ramType:"DDR5",cap:64,speed:6000},
    {id:"ram84",brand:"TeamGroup",name:"TeamGroup T-Force Delta 64GB DDR5-6000",model:"TeamGroup T-Force Delta 64GB DDR5-6000",variantLabel:"TeamGroup",price:920,perf:91,ramType:"DDR5",cap:64,speed:6000},
    {id:"ram85",brand:"Corsair",name:"Corsair Vengeance 96GB DDR5-6400",model:"Corsair Vengeance 96GB DDR5-6400",variantLabel:"Corsair",price:1300,perf:96,ramType:"DDR5",cap:96,speed:6400},
    {id:"ram86",brand:"G.Skill",name:"G.Skill Flare X5 96GB DDR5-6400",model:"G.Skill Flare X5 96GB DDR5-6400",variantLabel:"G.Skill",price:1325,perf:96,ramType:"DDR5",cap:96,speed:6400},
    {id:"ram87",brand:"G.Skill",name:"G.Skill Trident Z5 96GB DDR5-6400",model:"G.Skill Trident Z5 96GB DDR5-6400",variantLabel:"G.Skill",price:1350,perf:96,ramType:"DDR5",cap:96,speed:6400},
    {id:"ram88",brand:"TeamGroup",name:"TeamGroup T-Force Delta 96GB DDR5-6400",model:"TeamGroup T-Force Delta 96GB DDR5-6400",variantLabel:"TeamGroup",price:1405,perf:96,ramType:"DDR5",cap:96,speed:6400},
  ],
  storage: [
    {id:"ssd1",brand:"Crucial",name:"Crucial BX500 1TB",model:"Crucial BX500 1TB",variantLabel:"Crucial",price:110,perf:35,kind:"SATA",cap:1000,iface:"SATA"},
    {id:"ssd2",brand:"Crucial",name:"Crucial BX500 2TB",model:"Crucial BX500 2TB",variantLabel:"Crucial",price:210,perf:46,kind:"SATA",cap:2000,iface:"SATA"},
    {id:"ssd3",brand:"WD",name:"WD Blue SA510 1TB",model:"WD Blue SA510 1TB",variantLabel:"WD",price:100,perf:36,kind:"SATA",cap:1000,iface:"SATA"},
    {id:"ssd4",brand:"WD",name:"WD Blue SA510 2TB",model:"WD Blue SA510 2TB",variantLabel:"WD",price:200,perf:47,kind:"SATA",cap:2000,iface:"SATA"},
    {id:"ssd5",brand:"Samsung",name:"Samsung 870 EVO 1TB",model:"Samsung 870 EVO 1TB",variantLabel:"Samsung",price:120,perf:40,kind:"SATA",cap:1000,iface:"SATA"},
    {id:"ssd6",brand:"Samsung",name:"Samsung 870 EVO 2TB",model:"Samsung 870 EVO 2TB",variantLabel:"Samsung",price:230,perf:48,kind:"SATA",cap:2000,iface:"SATA"},
    {id:"ssd7",brand:"Samsung",name:"Samsung 870 EVO 4TB",model:"Samsung 870 EVO 4TB",variantLabel:"Samsung",price:500,perf:52,kind:"SATA",cap:4000,iface:"SATA"},
    {id:"ssd8",brand:"Crucial",name:"Crucial P3 Plus 1TB",model:"Crucial P3 Plus 1TB",variantLabel:"Crucial",price:140,perf:55,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd9",brand:"Crucial",name:"Crucial P3 Plus 2TB",model:"Crucial P3 Plus 2TB",variantLabel:"Crucial",price:270,perf:66,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd10",brand:"Crucial",name:"Crucial P3 Plus 4TB",model:"Crucial P3 Plus 4TB",variantLabel:"Crucial",price:640,perf:82,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd11",brand:"WD",name:"WD Black SN770 1TB",model:"WD Black SN770 1TB",variantLabel:"WD",price:150,perf:62,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd12",brand:"WD",name:"WD Black SN770 2TB",model:"WD Black SN770 2TB",variantLabel:"WD",price:300,perf:72,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd13",brand:"Samsung",name:"Samsung 990 EVO 1TB",model:"Samsung 990 EVO 1TB",variantLabel:"Samsung",price:160,perf:60,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd14",brand:"Samsung",name:"Samsung 990 EVO 2TB",model:"Samsung 990 EVO 2TB",variantLabel:"Samsung",price:300,perf:70,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd15",brand:"Kingston",name:"Kingston NV3 1TB",model:"Kingston NV3 1TB",variantLabel:"Kingston",price:130,perf:58,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd16",brand:"Kingston",name:"Kingston NV3 2TB",model:"Kingston NV3 2TB",variantLabel:"Kingston",price:250,perf:68,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd17",brand:"Lexar",name:"Lexar NM790 1TB",model:"Lexar NM790 1TB",variantLabel:"Lexar",price:150,perf:64,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd18",brand:"Lexar",name:"Lexar NM790 2TB",model:"Lexar NM790 2TB",variantLabel:"Lexar",price:290,perf:76,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd19",brand:"Lexar",name:"Lexar NM790 4TB",model:"Lexar NM790 4TB",variantLabel:"Lexar",price:700,perf:86,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd20",brand:"TeamGroup",name:"TeamGroup MP44 1TB",model:"TeamGroup MP44 1TB",variantLabel:"TeamGroup",price:140,perf:62,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd21",brand:"TeamGroup",name:"TeamGroup MP44 2TB",model:"TeamGroup MP44 2TB",variantLabel:"TeamGroup",price:280,perf:74,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd22",brand:"Crucial",name:"Crucial T500 1TB",model:"Crucial T500 1TB",variantLabel:"Crucial",price:160,perf:72,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd23",brand:"Crucial",name:"Crucial T500 2TB",model:"Crucial T500 2TB",variantLabel:"Crucial",price:290,perf:80,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd24",brand:"Crucial",name:"Crucial T500 4TB",model:"Crucial T500 4TB",variantLabel:"Crucial",price:720,perf:88,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd25",brand:"Samsung",name:"Samsung 990 Pro 1TB",model:"Samsung 990 Pro 1TB",variantLabel:"Samsung",price:180,perf:78,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd26",brand:"Samsung",name:"Samsung 990 Pro 2TB",model:"Samsung 990 Pro 2TB",variantLabel:"Samsung",price:330,perf:84,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd27",brand:"Samsung",name:"Samsung 990 Pro 4TB",model:"Samsung 990 Pro 4TB",variantLabel:"Samsung",price:760,perf:92,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd28",brand:"WD",name:"WD Black SN850X 1TB",model:"WD Black SN850X 1TB",variantLabel:"WD",price:170,perf:80,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd29",brand:"WD",name:"WD Black SN850X 2TB",model:"WD Black SN850X 2TB",variantLabel:"WD",price:379,perf:86,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd30",brand:"WD",name:"WD Black SN850X 4TB",model:"WD Black SN850X 4TB",variantLabel:"WD",price:780,perf:93,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd31",brand:"Kingston",name:"Kingston KC3000 1TB",model:"Kingston KC3000 1TB",variantLabel:"Kingston",price:170,perf:78,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd32",brand:"Kingston",name:"Kingston KC3000 2TB",model:"Kingston KC3000 2TB",variantLabel:"Kingston",price:330,perf:85,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd33",brand:"Corsair",name:"Corsair MP600 GS 1TB",model:"Corsair MP600 GS 1TB",variantLabel:"Corsair",price:160,perf:76,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd34",brand:"Corsair",name:"Corsair MP600 GS 2TB",model:"Corsair MP600 GS 2TB",variantLabel:"Corsair",price:310,perf:84,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd35",brand:"Seagate",name:"Seagate FireCuda 530 1TB",model:"Seagate FireCuda 530 1TB",variantLabel:"Seagate",price:180,perf:80,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd36",brand:"Seagate",name:"Seagate FireCuda 530 2TB",model:"Seagate FireCuda 530 2TB",variantLabel:"Seagate",price:360,perf:87,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd37",brand:"Seagate",name:"Seagate FireCuda 530 4TB",model:"Seagate FireCuda 530 4TB",variantLabel:"Seagate",price:800,perf:93,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd38",brand:"Sabrent",name:"Sabrent Rocket 4 Plus 1TB",model:"Sabrent Rocket 4 Plus 1TB",variantLabel:"Sabrent",price:170,perf:79,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd39",brand:"Sabrent",name:"Sabrent Rocket 4 Plus 2TB",model:"Sabrent Rocket 4 Plus 2TB",variantLabel:"Sabrent",price:340,perf:86,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd40",brand:"Crucial",name:"Crucial T705 Gen5 1TB",model:"Crucial T705 Gen5 1TB",variantLabel:"Crucial",price:245,perf:86,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd41",brand:"Crucial",name:"Crucial T705 Gen5 2TB",model:"Crucial T705 Gen5 2TB",variantLabel:"Crucial",price:480,perf:93,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd42",brand:"Crucial",name:"Crucial T705 Gen5 4TB",model:"Crucial T705 Gen5 4TB",variantLabel:"Crucial",price:980,perf:97,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd43",brand:"Samsung",name:"Samsung 9100 Pro Gen5 1TB",model:"Samsung 9100 Pro Gen5 1TB",variantLabel:"Samsung",price:260,perf:88,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd44",brand:"Samsung",name:"Samsung 9100 Pro Gen5 2TB",model:"Samsung 9100 Pro Gen5 2TB",variantLabel:"Samsung",price:500,perf:94,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd45",brand:"Samsung",name:"Samsung 9100 Pro Gen5 4TB",model:"Samsung 9100 Pro Gen5 4TB",variantLabel:"Samsung",price:1000,perf:98,kind:"NVMe",cap:4000,iface:"M.2"},
    {id:"ssd46",brand:"Sabrent",name:"Sabrent Rocket 5 Gen5 1TB",model:"Sabrent Rocket 5 Gen5 1TB",variantLabel:"Sabrent",price:250,perf:87,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd47",brand:"Sabrent",name:"Sabrent Rocket 5 Gen5 2TB",model:"Sabrent Rocket 5 Gen5 2TB",variantLabel:"Sabrent",price:490,perf:93,kind:"NVMe",cap:2000,iface:"M.2"},
    {id:"ssd48",brand:"Corsair",name:"Corsair MP700 Gen5 1TB",model:"Corsair MP700 Gen5 1TB",variantLabel:"Corsair",price:250,perf:87,kind:"NVMe",cap:1000,iface:"M.2"},
    {id:"ssd49",brand:"Corsair",name:"Corsair MP700 Gen5 2TB",model:"Corsair MP700 Gen5 2TB",variantLabel:"Corsair",price:495,perf:94,kind:"NVMe",cap:2000,iface:"M.2"},
  ],
  psu: [
    {id:"psu1",brand:"EVGA",name:"EVGA BR 500W",model:"EVGA BR 500W",variantLabel:"EVGA",price:60,perf:40,watt:500,eff:"Bronze"},
    {id:"psu2",brand:"EVGA",name:"EVGA BR 600W",model:"EVGA BR 600W",variantLabel:"EVGA",price:70,perf:44,watt:600,eff:"Bronze"},
    {id:"psu3",brand:"EVGA",name:"EVGA BR 700W",model:"EVGA BR 700W",variantLabel:"EVGA",price:80,perf:48,watt:700,eff:"Bronze"},
    {id:"psu4",brand:"MSI",name:"MSI MAG A-BN 550W",model:"MSI MAG A-BN 550W",variantLabel:"MSI",price:60,perf:44,watt:550,eff:"Bronze"},
    {id:"psu5",brand:"MSI",name:"MSI MAG A-BN 650W",model:"MSI MAG A-BN 650W",variantLabel:"MSI",price:70,perf:48,watt:650,eff:"Bronze"},
    {id:"psu6",brand:"MSI",name:"MSI MAG A-BN 750W",model:"MSI MAG A-BN 750W",variantLabel:"MSI",price:85,perf:52,watt:750,eff:"Bronze"},
    {id:"psu7",brand:"Corsair",name:"Corsair CX 650W",model:"Corsair CX 650W",variantLabel:"Corsair",price:75,perf:50,watt:650,eff:"Bronze"},
    {id:"psu8",brand:"Corsair",name:"Corsair CX 750W",model:"Corsair CX 750W",variantLabel:"Corsair",price:90,perf:54,watt:750,eff:"Bronze"},
    {id:"psu9",brand:"Thermaltake",name:"Thermaltake Smart BX1 600W",model:"Thermaltake Smart BX1 600W",variantLabel:"Thermaltake",price:65,perf:44,watt:600,eff:"Bronze"},
    {id:"psu10",brand:"Thermaltake",name:"Thermaltake Smart BX1 700W",model:"Thermaltake Smart BX1 700W",variantLabel:"Thermaltake",price:78,perf:48,watt:700,eff:"Bronze"},
    {id:"psu11",brand:"Cooler",name:"Cooler Master MWE Bronze 650W",model:"Cooler Master MWE Bronze 650W",variantLabel:"Cooler",price:70,perf:48,watt:650,eff:"Bronze"},
    {id:"psu12",brand:"Cooler",name:"Cooler Master MWE Bronze 750W",model:"Cooler Master MWE Bronze 750W",variantLabel:"Cooler",price:82,perf:52,watt:750,eff:"Bronze"},
    {id:"psu13",brand:"Corsair",name:"Corsair RMe 750W",model:"Corsair RMe 750W",variantLabel:"Corsair",price:110,perf:74,watt:750,eff:"Gold"},
    {id:"psu14",brand:"Corsair",name:"Corsair RMe 850W",model:"Corsair RMe 850W",variantLabel:"Corsair",price:130,perf:78,watt:850,eff:"Gold"},
    {id:"psu15",brand:"Corsair",name:"Corsair RMe 1000W",model:"Corsair RMe 1000W",variantLabel:"Corsair",price:180,perf:82,watt:1000,eff:"Gold"},
    {id:"psu16",brand:"Corsair",name:"Corsair RMx 850W",model:"Corsair RMx 850W",variantLabel:"Corsair",price:150,perf:82,watt:850,eff:"Gold"},
    {id:"psu17",brand:"Corsair",name:"Corsair RMx 1000W",model:"Corsair RMx 1000W",variantLabel:"Corsair",price:200,perf:84,watt:1000,eff:"Gold"},
    {id:"psu18",brand:"Seasonic",name:"Seasonic Focus GX 750W",model:"Seasonic Focus GX 750W",variantLabel:"Seasonic",price:120,perf:76,watt:750,eff:"Gold"},
    {id:"psu19",brand:"Seasonic",name:"Seasonic Focus GX 850W",model:"Seasonic Focus GX 850W",variantLabel:"Seasonic",price:140,perf:80,watt:850,eff:"Gold"},
    {id:"psu20",brand:"Seasonic",name:"Seasonic Focus GX 1000W",model:"Seasonic Focus GX 1000W",variantLabel:"Seasonic",price:190,perf:84,watt:1000,eff:"Gold"},
    {id:"psu21",brand:"MSI",name:"MSI MAG A-GL 750W",model:"MSI MAG A-GL 750W",variantLabel:"MSI",price:110,perf:74,watt:750,eff:"Gold"},
    {id:"psu22",brand:"MSI",name:"MSI MAG A-GL 850W",model:"MSI MAG A-GL 850W",variantLabel:"MSI",price:125,perf:78,watt:850,eff:"Gold"},
    {id:"psu23",brand:"be",name:"be quiet! Pure Power 12 750W",model:"be quiet! Pure Power 12 750W",variantLabel:"be",price:115,perf:76,watt:750,eff:"Gold"},
    {id:"psu24",brand:"be",name:"be quiet! Pure Power 12 850W",model:"be quiet! Pure Power 12 850W",variantLabel:"be",price:135,perf:80,watt:850,eff:"Gold"},
    {id:"psu25",brand:"Cooler",name:"Cooler Master V Gold 750W",model:"Cooler Master V Gold 750W",variantLabel:"Cooler",price:120,perf:78,watt:750,eff:"Gold"},
    {id:"psu26",brand:"Cooler",name:"Cooler Master V Gold 850W",model:"Cooler Master V Gold 850W",variantLabel:"Cooler",price:140,perf:82,watt:850,eff:"Gold"},
    {id:"psu27",brand:"NZXT",name:"NZXT C 750W",model:"NZXT C 750W",variantLabel:"NZXT",price:115,perf:76,watt:750,eff:"Gold"},
    {id:"psu28",brand:"NZXT",name:"NZXT C 850W",model:"NZXT C 850W",variantLabel:"NZXT",price:135,perf:80,watt:850,eff:"Gold"},
    {id:"psu29",brand:"ASUS",name:"ASUS TUF Gaming 750W",model:"ASUS TUF Gaming 750W",variantLabel:"ASUS",price:120,perf:78,watt:750,eff:"Gold"},
    {id:"psu30",brand:"ASUS",name:"ASUS TUF Gaming 850W",model:"ASUS TUF Gaming 850W",variantLabel:"ASUS",price:145,perf:82,watt:850,eff:"Gold"},
    {id:"psu31",brand:"Thermaltake",name:"Thermaltake Toughpower GF 850W",model:"Thermaltake Toughpower GF 850W",variantLabel:"Thermaltake",price:140,perf:80,watt:850,eff:"Gold"},
    {id:"psu32",brand:"Thermaltake",name:"Thermaltake Toughpower GF 1000W",model:"Thermaltake Toughpower GF 1000W",variantLabel:"Thermaltake",price:195,perf:84,watt:1000,eff:"Gold"},
    {id:"psu33",brand:"Corsair",name:"Corsair SF 750W",model:"Corsair SF 750W",variantLabel:"Corsair",price:150,perf:86,watt:750,eff:"Gold"},
    {id:"psu34",brand:"Corsair",name:"Corsair SF 850W",model:"Corsair SF 850W",variantLabel:"Corsair",price:170,perf:88,watt:850,eff:"Gold"},
    {id:"psu35",brand:"be",name:"be quiet! Straight Power 12 850W",model:"be quiet! Straight Power 12 850W",variantLabel:"be",price:180,perf:90,watt:850,eff:"Platinum"},
    {id:"psu36",brand:"be",name:"be quiet! Straight Power 12 1000W",model:"be quiet! Straight Power 12 1000W",variantLabel:"be",price:210,perf:92,watt:1000,eff:"Platinum"},
    {id:"psu37",brand:"be",name:"be quiet! Straight Power 12 1200W",model:"be quiet! Straight Power 12 1200W",variantLabel:"be",price:280,perf:94,watt:1200,eff:"Platinum"},
    {id:"psu38",brand:"Corsair",name:"Corsair HX 1000W",model:"Corsair HX 1000W",variantLabel:"Corsair",price:230,perf:93,watt:1000,eff:"Platinum"},
    {id:"psu39",brand:"Corsair",name:"Corsair HX 1200W",model:"Corsair HX 1200W",variantLabel:"Corsair",price:290,perf:95,watt:1200,eff:"Platinum"},
    {id:"psu40",brand:"Seasonic",name:"Seasonic Vertex GX 1000W",model:"Seasonic Vertex GX 1000W",variantLabel:"Seasonic",price:200,perf:91,watt:1000,eff:"Platinum"},
    {id:"psu41",brand:"Seasonic",name:"Seasonic Vertex GX 1200W",model:"Seasonic Vertex GX 1200W",variantLabel:"Seasonic",price:270,perf:94,watt:1200,eff:"Platinum"},
    {id:"psu42",brand:"ASUS",name:"ASUS ROG Strix 1000W",model:"ASUS ROG Strix 1000W",variantLabel:"ASUS",price:250,perf:93,watt:1000,eff:"Platinum"},
    {id:"psu43",brand:"Seasonic",name:"Seasonic Prime TX 1000W",model:"Seasonic Prime TX 1000W",variantLabel:"Seasonic",price:300,perf:97,watt:1000,eff:"Titanium"},
    {id:"psu44",brand:"Seasonic",name:"Seasonic Prime TX 1300W",model:"Seasonic Prime TX 1300W",variantLabel:"Seasonic",price:400,perf:99,watt:1300,eff:"Titanium"},
    {id:"psu45",brand:"Corsair",name:"Corsair AX 1200W",model:"Corsair AX 1200W",variantLabel:"Corsair",price:360,perf:98,watt:1200,eff:"Titanium"},
    {id:"psu46",brand:"Corsair",name:"Corsair AX 1600W",model:"Corsair AX 1600W",variantLabel:"Corsair",price:500,perf:99,watt:1600,eff:"Titanium"},
  ],
  case: [
    {id:"cs1",brand:"Cooler Master",name:"Q300L V2",model:"Q300L V2",variantLabel:"Cooler Master",price:55,perf:52,forms:["ITX","mATX"],maxGpu:360,maxCool:159},
    {id:"cs2",brand:"Cooler Master",name:"NR200P",model:"NR200P",variantLabel:"Cooler Master",price:90,perf:60,forms:["ITX"],maxGpu:330,maxCool:155},
    {id:"cs3",brand:"Cooler Master",name:"MasterBox TD500",model:"MasterBox TD500",variantLabel:"Cooler Master",price:100,perf:72,forms:["ITX","mATX","ATX"],maxGpu:410,maxCool:165},
    {id:"cs4",brand:"Montech",name:"AIR 903 MAX",model:"AIR 903 MAX",variantLabel:"Montech",price:75,perf:66,forms:["ITX","mATX","ATX"],maxGpu:400,maxCool:175},
    {id:"cs5",brand:"Montech",name:"XR",model:"XR",variantLabel:"Montech",price:90,perf:70,forms:["ITX","mATX","ATX"],maxGpu:400,maxCool:170},
    {id:"cs6",brand:"Lian Li",name:"Lancool 207",model:"Lancool 207",variantLabel:"Lian Li",price:100,perf:74,forms:["ITX","mATX","ATX"],maxGpu:380,maxCool:175},
    {id:"cs7",brand:"Lian Li",name:"Lancool 216",model:"Lancool 216",variantLabel:"Lian Li",price:110,perf:78,forms:["ITX","mATX","ATX"],maxGpu:392,maxCool:180},
    {id:"cs8",brand:"Lian Li",name:"O11 Dynamic EVO",model:"O11 Dynamic EVO",variantLabel:"Lian Li",price:170,perf:85,forms:["ITX","mATX","ATX"],maxGpu:420,maxCool:167},
    {id:"cs9",brand:"Lian Li",name:"O11 Vision",model:"O11 Vision",variantLabel:"Lian Li",price:190,perf:86,forms:["ITX","mATX","ATX"],maxGpu:452,maxCool:167},
    {id:"cs10",brand:"Corsair",name:"4000D Airflow",model:"4000D Airflow",variantLabel:"Corsair",price:105,perf:76,forms:["ITX","mATX","ATX"],maxGpu:360,maxCool:170},
    {id:"cs11",brand:"Corsair",name:"3500X",model:"3500X",variantLabel:"Corsair",price:115,perf:80,forms:["ITX","mATX","ATX"],maxGpu:400,maxCool:170},
    {id:"cs12",brand:"NZXT",name:"H6 Flow",model:"H6 Flow",variantLabel:"NZXT",price:110,perf:74,forms:["ITX","mATX","ATX"],maxGpu:365,maxCool:163},
    {id:"cs13",brand:"NZXT",name:"H7 Flow",model:"H7 Flow",variantLabel:"NZXT",price:130,perf:80,forms:["ITX","mATX","ATX"],maxGpu:400,maxCool:185},
    {id:"cs14",brand:"be quiet!",name:"Pure Base 500DX",model:"Pure Base 500DX",variantLabel:"be quiet!",price:110,perf:78,forms:["ITX","mATX","ATX"],maxGpu:369,maxCool:190},
    {id:"cs15",brand:"Fractal",name:"Pop Air",model:"Pop Air",variantLabel:"Fractal",price:100,perf:72,forms:["ITX","mATX","ATX"],maxGpu:380,maxCool:170},
    {id:"cs16",brand:"Fractal",name:"North",model:"North",variantLabel:"Fractal",price:150,perf:82,forms:["ITX","mATX","ATX"],maxGpu:355,maxCool:170},
    {id:"cs17",brand:"Fractal",name:"Ridge ITX",model:"Ridge ITX",variantLabel:"Fractal",price:130,perf:64,forms:["ITX"],maxGpu:325,maxCool:70},
    {id:"cs18",brand:"Fractal",name:"Meshify 2",model:"Meshify 2",variantLabel:"Fractal",price:160,perf:84,forms:["ITX","mATX","ATX"],maxGpu:460,maxCool:185},
    {id:"cs19",brand:"Hyte",name:"Y70",model:"Y70",variantLabel:"Hyte",price:200,perf:88,forms:["ITX","mATX","ATX"],maxGpu:422,maxCool:180},
    {id:"cs20",brand:"Phanteks",name:"NV7",model:"NV7",variantLabel:"Phanteks",price:190,perf:86,forms:["ITX","mATX","ATX"],maxGpu:440,maxCool:185},
    {id:"cs21",brand:"Phanteks",name:"Eclipse G360A",model:"Eclipse G360A",variantLabel:"Phanteks",price:100,perf:74,forms:["ITX","mATX","ATX"],maxGpu:400,maxCool:162},
    {id:"cs22",brand:"Thermaltake",name:"Tower 300 mATX",model:"Tower 300 mATX",variantLabel:"Thermaltake",price:140,perf:76,forms:["ITX","mATX"],maxGpu:380,maxCool:180},
  ],
  cooler: [
    {id:"cl1",brand:"AMD",name:"Wraith Stealth",model:"Wraith Stealth",variantLabel:"AMD",price:20,perf:30,sockets:["AM4","AM5"],height:65,tdpRating:65,type:"air"},
    {id:"cl2",brand:"Intel",name:"Laminar RM1",model:"Laminar RM1",variantLabel:"Intel",price:20,perf:28,sockets:["LGA1700","LGA1851","LGA1200"],height:47,tdpRating:65,type:"air"},
    {id:"cl3",brand:"Cooler Master",name:"Hyper 212 Black",model:"Hyper 212 Black",variantLabel:"Cooler Master",price:40,perf:55,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:159,tdpRating:150,type:"air"},
    {id:"cl4",brand:"be quiet!",name:"Pure Rock 2",model:"Pure Rock 2",variantLabel:"be quiet!",price:45,perf:60,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:155,tdpRating:150,type:"air"},
    {id:"cl5",brand:"ID-Cooling",name:"SE-214 XT",model:"SE-214 XT",variantLabel:"ID-Cooling",price:20,perf:45,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:150,tdpRating:150,type:"air"},
    {id:"cl6",brand:"Thermalright",name:"Assassin X120 R SE",model:"Assassin X120 R SE",variantLabel:"Thermalright",price:25,perf:55,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:155,tdpRating:160,type:"air"},
    {id:"cl7",brand:"Thermalright",name:"Peerless Assassin 120 SE",model:"Peerless Assassin 120 SE",variantLabel:"Thermalright",price:40,perf:78,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:155,tdpRating:245,type:"air"},
    {id:"cl8",brand:"Thermalright",name:"Phantom Spirit 120 SE",model:"Phantom Spirit 120 SE",variantLabel:"Thermalright",price:45,perf:82,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:157,tdpRating:245,type:"air"},
    {id:"cl9",brand:"DeepCool",name:"AK400",model:"AK400",variantLabel:"DeepCool",price:40,perf:72,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:155,tdpRating:220,type:"air"},
    {id:"cl10",brand:"DeepCool",name:"AK620",model:"AK620",variantLabel:"DeepCool",price:65,perf:82,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:160,tdpRating:260,type:"air"},
    {id:"cl11",brand:"Noctua",name:"NH-U12S redux",model:"NH-U12S redux",variantLabel:"Noctua",price:55,perf:80,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:158,tdpRating:180,type:"air"},
    {id:"cl12",brand:"Noctua",name:"NH-D15 G2",model:"NH-D15 G2",variantLabel:"Noctua",price:150,perf:92,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:168,tdpRating:290,type:"air"},
    {id:"cl13",brand:"Noctua",name:"NH-L9i low-profile",model:"NH-L9i low-profile",variantLabel:"Noctua",price:55,perf:50,sockets:["LGA1700","LGA1851","LGA1200"],height:37,tdpRating:95,type:"air"},
    {id:"cl14",brand:"be quiet!",name:"Dark Rock Pro 5",model:"Dark Rock Pro 5",variantLabel:"be quiet!",price:100,perf:90,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:168,tdpRating:270,type:"air"},
    {id:"cl15",brand:"Arctic",name:"Liquid Freezer III 240",model:"Liquid Freezer III 240",variantLabel:"Arctic",price:95,perf:85,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:280,type:"aio"},
    {id:"cl16",brand:"Arctic",name:"Liquid Freezer III 280",model:"Liquid Freezer III 280",variantLabel:"Arctic",price:110,perf:88,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:300,type:"aio"},
    {id:"cl17",brand:"Arctic",name:"Liquid Freezer III 360",model:"Liquid Freezer III 360",variantLabel:"Arctic",price:120,perf:95,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:360,type:"aio"},
    {id:"cl18",brand:"Corsair",name:"iCUE H100i",model:"iCUE H100i",variantLabel:"Corsair",price:130,perf:82,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:250,type:"aio"},
    {id:"cl19",brand:"Corsair",name:"iCUE H150i",model:"iCUE H150i",variantLabel:"Corsair",price:180,perf:90,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:350,type:"aio"},
    {id:"cl20",brand:"NZXT",name:"Kraken 240",model:"Kraken 240",variantLabel:"NZXT",price:150,perf:86,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:280,type:"aio"},
    {id:"cl21",brand:"NZXT",name:"Kraken 360",model:"Kraken 360",variantLabel:"NZXT",price:200,perf:92,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:350,type:"aio"},
    {id:"cl22",brand:"Lian Li",name:"Galahad II 360",model:"Galahad II 360",variantLabel:"Lian Li",price:190,perf:93,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:350,type:"aio"},
    {id:"cl23",brand:"DeepCool",name:"LS520",model:"LS520",variantLabel:"DeepCool",price:100,perf:85,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:280,type:"aio"},
    {id:"cl24",brand:"Thermalright",name:"Frozen Notte 360",model:"Frozen Notte 360",variantLabel:"Thermalright",price:90,perf:90,sockets:["AM4","AM5","LGA1700","LGA1851","LGA1200"],height:55,tdpRating:350,type:"aio"},
  ],
};

const CATEGORY_ORDER = ["cpu", "gpu", "mobo", "ram", "storage", "psu", "case", "cooler"];
const CAT_META = {
  cpu:     { label: "CPU",          Icon: Cpu },
  gpu:     { label: "Graphics Card",Icon: MonitorPlay },
  mobo:    { label: "Motherboard",  Icon: CircuitBoard },
  ram:     { label: "Memory",       Icon: MemoryStick },
  storage: { label: "Storage",      Icon: HardDrive },
  psu:     { label: "Power Supply", Icon: Power },
  case:    { label: "Case",         Icon: Box },
  cooler:  { label: "CPU Cooler",   Icon: Fan },
};

/* The allocation table — the "secret sauce". % of budget per category. */
const USE_CASES = {
  gaming:      { label: "Gaming",          tag: "Max FPS",            Icon: Gamepad2,    alloc: { gpu:30, cpu:15, mobo:9, ram:18, storage:10, psu:7, case:6, cooler:5 } },
  content:     { label: "Content Creation",tag: "Video & Photo",      Icon: Clapperboard,alloc: { gpu:18, cpu:22, mobo:10, ram:22, storage:15, psu:6, case:4, cooler:3 } },
  streaming:   { label: "Streaming",       tag: "Play & Broadcast",   Icon: Radio,       alloc: { gpu:26, cpu:19, mobo:10, ram:18, storage:10, psu:7, case:5, cooler:5 } },
  workstation: { label: "3D / Workstation",tag: "Render & CAD",       Icon: Boxes,       alloc: { gpu:22, cpu:24, mobo:9, ram:24, storage:10, psu:5, case:3, cooler:3 } },
  ai:          { label: "AI / ML",         tag: "VRAM Hungry",        Icon: BrainCircuit,alloc: { gpu:38, cpu:13, mobo:8, ram:20, storage:8, psu:6, case:4, cooler:3 } },
  office:      { label: "Office / Everyday",tag: "Snappy & Cheap",    Icon: Briefcase,   alloc: { gpu:0, cpu:24, mobo:13, ram:26, storage:20, psu:8, case:6, cooler:3 } },
};

const MAX_PERF = Object.fromEntries(
  CATEGORY_ORDER.map((c) => [c, Math.max(...CATALOG[c].map((p) => p.perf))])
);
const CATALOG_COUNT = Object.values(CATALOG).reduce((s, a) => s + a.length, 0);

const fmt = (n) => "$" + Math.round(n).toLocaleString();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ----------------------------- SCORING ----------------------------- */
// Use-case-aware performance: the same part is worth more or less depending on
// what you're building for. Gaming leans on the base (gaming-weighted) score;
// productivity rewards CPU cores; AI/content reward GPU VRAM; workstation/AI/
// content reward RAM & storage capacity; gaming treats 32GB RAM as the sweet spot.
function ucPerf(cat, part, uc) {
  const heavyRam = uc === "workstation" || uc === "ai" || uc === "content";
  switch (cat) {
    case "cpu":
      if (uc === "content" || uc === "workstation" || uc === "ai")
        return part.perf * 0.6 + (Math.min(part.cores, 16) / 16) * 100 * 0.4;
      return part.perf;
    case "gpu":
      if (uc === "ai") return part.perf * 0.5 + (Math.min(part.vram, 32) / 32) * 100 * 0.5;
      if (uc === "content") return part.perf * 0.7 + (Math.min(part.vram, 32) / 32) * 100 * 0.3;
      return part.perf;
    case "ram": {
      // value-aware speed: peaks at DDR5-6000 (the CL30 sweet spot). Faster kits
      // (6400/7200) cost more for no real-world gain, so they score LOWER; slower dips too.
      const sp = part.speed <= 6000
        ? (part.speed / 6000) * 50
        : Math.max(20, 50 - ((part.speed - 6000) / 100) * 1.5);
      if (heavyRam) return sp * 0.4 + (Math.min(part.cap, 96) / 96) * 100 * 0.6; // capacity-led
      return sp + (part.cap >= 32 ? 50 : (part.cap / 32) * 50); // 32GB is the sweet spot
    }
    case "storage":
      if (uc === "content" || uc === "workstation")
        return part.perf * 0.5 + (Math.min(part.cap, 4000) / 4000) * 100 * 0.5;
      // gaming / streaming / office: reward capacity up to 2TB (so roomy budgets pick 2TB)
      return part.perf * 0.6 + (Math.min(part.cap, 2000) / 2000) * 100 * 0.4;
    default:
      return part.perf; // mobo, psu, case, cooler: use-case agnostic
  }
}
const _ucMax = {};
function ucMaxPerf(cat, uc) {
  const k = cat + "|" + uc;
  if (_ucMax[k] == null) _ucMax[k] = Math.max(...CATALOG[cat].map((p) => ucPerf(cat, p, uc)));
  return _ucMax[k];
}

// Diminishing-returns ceilings: spending past these on a category is poor value,
// so the part's score is reduced (but it is NOT flagged over budget).
const VALUE_CEILING = { mobo: 250 };

// Newer GPUs are preferred — older cards are often out of stock or used-only.
function modernityFactor(part) {
  if (part.cat !== "gpu") return 1;
  const m = part.model || part.name || "";
  if (/RTX\s?50|RX\s?90|Arc\s?B/i.test(m)) return 1;      // current gen, in stock
  if (/RTX\s?40|RX\s?7[6-9]00/i.test(m)) return 0.9;      // last gen, still available
  return 0.78;                                            // older — often out of stock / used
}

// Per-part score: within the category budget band, more (use-case-relevant)
// performance is better; going over the band lowers the score gradually (a little
// over barely hurts), and current-gen GPUs get a preference for availability.
function partScore(part, band, useCase) {
  const norm =
    part.cat && useCase
      ? ucPerf(part.cat, part, useCase) / ucMaxPerf(part.cat, useCase)
      : part.cat
      ? part.perf / MAX_PERF[part.cat]
      : part.perf / 100;
  // value ceiling: spending past it (e.g. >$250 on a motherboard) just lowers the
  // score for poor value — it does NOT flag the part as "over budget".
  let vmult = 1;
  const ceil = part.cat ? VALUE_CEILING[part.cat] : undefined;
  if (ceil && part.price > ceil) vmult = Math.max(0.45, 1 - (part.price / ceil - 1) * 0.45);
  let mult = 1;
  if (band > 0) {
    const r = part.price / band;
    if (r > 1) mult = Math.max(0.3, 1 - (r - 1) * 0.3); // gentle, gradual — a little over barely dents it
  } else if (part.price > 0) {
    mult = 0.4; // category isn't budgeted for at all (e.g. discrete GPU on an office build)
  }
  return Math.round(clamp(norm * 100 * mult * vmult * modernityFactor(part), 0, 100));
}
function budgetStatus(price, band) {
  if (band <= 0) return price > 0 ? "over" : "within";
  const r = price / band;
  if (r <= 1) return "within";
  if (r <= 1.25) return "tight";
  return "over";
}

/* ----------------------------- COMPATIBILITY ----------------------------- */
function requiredWatts(parts) {
  const cpu = parts.cpu?.tdp || 0;
  const gpu = parts.gpu?.tdp || 0;
  return cpu + gpu + 100; // ~100W system overhead
}
function checkCompat(parts) {
  const issues = [];
  const ok = [];
  const { cpu, gpu, mobo, ram, storage, psu, cooler } = parts;
  const cse = parts.case;

  if (cpu && mobo) {
    (cpu.socket === mobo.socket ? ok : issues).push(
      cpu.socket === mobo.socket
        ? `CPU socket ${cpu.socket} matches the motherboard`
        : `CPU socket ${cpu.socket} does not fit the ${mobo.socket} motherboard`
    );
  }
  if (ram && mobo) {
    (ram.ramType === mobo.ramType ? ok : issues).push(
      ram.ramType === mobo.ramType
        ? `${ram.ramType} memory matches the motherboard`
        : `${ram.ramType} memory won't work in a ${mobo.ramType} motherboard`
    );
    if (ram.cap > mobo.maxRam) issues.push(`Memory (${ram.cap}GB) exceeds the board's ${mobo.maxRam}GB limit`);
  }
  if (cooler && cpu) {
    (cooler.sockets.includes(cpu.socket) ? ok : issues).push(
      cooler.sockets.includes(cpu.socket)
        ? `Cooler supports the ${cpu.socket} socket`
        : `Cooler doesn't support the ${cpu.socket} socket`
    );
    (cooler.tdpRating >= cpu.tdp ? ok : issues).push(
      cooler.tdpRating >= cpu.tdp
        ? `Cooler handles the CPU's ${cpu.tdp}W heat output`
        : `Cooler is rated ${cooler.tdpRating}W — under the CPU's ${cpu.tdp}W`
    );
  }
  if (mobo && cse) {
    (cse.forms.includes(mobo.form) ? ok : issues).push(
      cse.forms.includes(mobo.form)
        ? `Case fits a ${mobo.form} motherboard`
        : `Case can't fit a ${mobo.form} motherboard`
    );
  }
  if (gpu && cse) {
    (gpu.len <= cse.maxGpu ? ok : issues).push(
      gpu.len <= cse.maxGpu
        ? `GPU (${gpu.len}mm) fits the case`
        : `GPU is ${gpu.len}mm — too long for this case (${cse.maxGpu}mm max)`
    );
  }
  if (cooler && cse && cooler.type === "air") {
    (cooler.height <= cse.maxCool ? ok : issues).push(
      cooler.height <= cse.maxCool
        ? `Air cooler clears the case`
        : `Cooler is ${cooler.height}mm tall — case allows ${cse.maxCool}mm`
    );
  }
  if (storage && mobo && storage.iface === "M.2") {
    (mobo.m2 >= 1 ? ok : issues).push(
      mobo.m2 >= 1 ? `M.2 slot available for the NVMe drive` : `No M.2 slot on this motherboard`
    );
  }
  if (psu) {
    const need = requiredWatts(parts);
    const safe = Math.ceil((need * 1.25) / 50) * 50;
    (psu.watt >= need * 1.25 ? ok : issues).push(
      psu.watt >= need * 1.25
        ? `${psu.watt}W PSU comfortably powers the build (~${need}W draw)`
        : `${psu.watt}W PSU is light — this build wants ~${safe}W`
    );
  }
  return { issues, ok, pass: issues.length === 0 };
}

// True if the part in `cat` introduces no compatibility issue beyond what the
// rest of the build already has. Used to zero out the score of incompatible parts.
function isPartCompatible(parts, cat) {
  if (!parts[cat]) return true;
  const withIssues = checkCompat(parts).issues.length;
  const rest = { ...parts };
  delete rest[cat];
  const withoutIssues = checkCompat(rest).issues.length;
  return withIssues <= withoutIssues;
}

/* ----------------------------- BUILD ANALYSIS ----------------------------- */
function buildPerfNorm(parts, alloc, useCase) {
  // weighted, normalized (use-case-relevant) performance of the whole build
  let sum = 0, wsum = 0;
  for (const c of CATEGORY_ORDER) {
    const w = alloc[c] || 0;
    if (w === 0) continue;
    const p = parts[c];
    const norm = p ? ucPerf(c, p, useCase) / ucMaxPerf(c, useCase) : 0;
    sum += w * norm;
    wsum += w;
  }
  return wsum ? sum / wsum : 0; // 0..1
}
function analyzeBuild(parts, useCaseKey, budget) {
  const uc = USE_CASES[useCaseKey];
  const alloc = uc.alloc;
  const compat = checkCompat(parts);
  const total = CATEGORY_ORDER.reduce((s, c) => s + (parts[c]?.price || 0), 0);
  const fitNorm = buildPerfNorm(parts, alloc, useCaseKey); // 0..1

  // balance / bottleneck (only where both GPU & CPU are weighted)
  const cpuNorm = parts.cpu ? ucPerf("cpu", parts.cpu, useCaseKey) / ucMaxPerf("cpu", useCaseKey) : 0;
  const gpuNorm = parts.gpu ? ucPerf("gpu", parts.gpu, useCaseKey) / ucMaxPerf("gpu", useCaseKey) : 0;
  let balance = 100;
  if (alloc.gpu > 0 && alloc.cpu > 0) {
    // CPU and GPU are normalized against very different ranges (a mid GPU is ~half
    // of a 5090, while a cheap X3D is near the CPU ceiling), so judge balance by a
    // tolerant gap rather than a strict ratio — only real mismatches are penalized.
    const gap = Math.abs(gpuNorm - cpuNorm);
    balance = Math.round(clamp(100 - gap * 85, 50, 100));
  }

  // budget adherence
  let budgetAdh;
  if (total <= budget) budgetAdh = Math.round(70 + 30 * (total / budget)); // reward using the budget
  else budgetAdh = Math.round(clamp(100 - ((total - budget) / budget) * 180, 0, 100));

  // completeness (office legitimately skips a discrete GPU)
  const need = CATEGORY_ORDER.filter((c) => !(c === "gpu" && alloc.gpu === 0));
  const have = need.filter((c) => parts[c]).length;
  const completeness = Math.round((have / need.length) * 100);
  const missing = need.filter((c) => !parts[c]);
  const complete = missing.length === 0;

  // ---- PERFORMANCE: use-case performance of the parts, scored out of 1000 ----
  // An incompatible build won't run, so its performance is 0.
  const score = compat.pass ? Math.round(clamp(fitNorm * 1000, 0, 1000)) : 0;

  // ---- PRICE / PERFORMANCE: how much performance you get per dollar (value) ----
  const pp = total > 0 ? (fitNorm / total) * 100000 : 0;
  const ppScore = compat.pass ? Math.round(clamp(pp * 1.2, 0, 100)) : 0;

  const bottleneck =
    alloc.gpu > 0 && alloc.cpu > 0
      ? gpuNorm - cpuNorm > 0.42
        ? "cpu"
        : cpuNorm - gpuNorm > 0.42
        ? "gpu"
        : null
      : null;

  return { compat, total, fitNorm, balance, budgetAdh, completeness, missing, complete, score, ppScore, bottleneck };
}

/* HYBRID verdict: the engine owns the number, this narrates it.
   Drop-in point for a live Claude API call — keep it cached/frozen on save
   so a saved build's number never drifts. */
function generateVerdict(parts, a, useCaseKey, budget) {
  const uc = USE_CASES[useCaseKey].label.toLowerCase();
  const out = [];
  if (a.missing && a.missing.length) {
    if (a.missing.length >= 5)
      return `Pick your parts to forge this ${uc} build — scores and compatibility update live as you add them.`;
    out.push(`Still to add: ${a.missing.map((c) => CAT_META[c].label).join(", ")}.`);
  }
  if (!a.compat.pass) {
    out.push(`This build won't run as-is — ${a.compat.issues.length} compatibility ${a.compat.issues.length === 1 ? "problem needs" : "problems need"} fixing before anything else matters.`);
  } else if (a.balance >= 82 && a.complete) {
    out.push(`A well-rounded ${uc} build — the parts are matched and the money landed where it counts.`);
  } else if (a.balance >= 62) {
    out.push(`A solid ${uc} build with a sensible balance of parts for the budget.`);
  } else if (a.balance >= 45) {
    out.push(`A decent ${uc} build, though the part balance could be tightened.`);
  } else {
    out.push(`The parts are a little mismatched for ${uc} — worth rebalancing the big-ticket parts.`);
  }
  if (a.bottleneck === "cpu") out.push(`The CPU is lagging the GPU and will bottleneck it in CPU-heavy moments — consider trading some GPU down for a stronger CPU.`);
  else if (a.bottleneck === "gpu") out.push(`The GPU is the weak link here — for ${uc} you'd usually push more budget toward it.`);
  if (a.total > budget) out.push(`It's ${fmt(a.total - budget)} over your ${fmt(budget)} budget.`);
  else if (budget - a.total > budget * 0.12) out.push(`You've left ${fmt(budget - a.total)} on the table — that headroom could upgrade the highest-impact part.`);
  if (a.compat.pass && a.total <= budget && a.budgetAdh >= 92) out.push(`It uses almost all of your budget — the money is well allocated.`);
  else if (a.compat.pass && a.complete && a.total <= budget * 0.8) out.push(`It comes in well under budget — there's room to push a key part higher.`);
  return out.join(" ");
}

/* ----------------------------- AUTO-ASSEMBLE ----------------------------- */
// Greedy, compatibility-aware, budget-aware. Picks in dependency order.
function assembleBuild(useCaseKey, budget) {
  const alloc = USE_CASES[useCaseKey].alloc;
  const target = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, (budget * (alloc[c] || 0)) / 100]));
  const parts = {};
  let spent = 0;

  const pick = (cat, pool, band) => {
    const remaining = budget - spent;
    const cheapest = Math.min(...pool.map((p) => p.price));
    const cap = Math.max(band * 1.15, Math.min(remaining, band * 1.15), cheapest);
    let affordable = pool.filter((p) => p.price <= Math.max(cap, cheapest));
    if (affordable.length === 0) affordable = pool.filter((p) => p.price === cheapest);
    // best (use-case-aware) score; tie -> cheaper (better value); then higher perf
    affordable.sort((x, y) => {
      const sx = partScore({ ...x, cat }, band, useCaseKey);
      const sy = partScore({ ...y, cat }, band, useCaseKey);
      return sy - sx || x.price - y.price || ucPerf(cat, y, useCaseKey) - ucPerf(cat, x, useCaseKey);
    });
    let chosen;
    if (cat === "cpu" || cat === "gpu") {
      // CPU & GPU matter most — take the highest match score the budget allows.
      chosen = affordable[0];
    } else {
      // Supporting parts: value knee — among options within ~7% of the best
      // performance in range, take the cheapest (don't overpay for a marginal gain).
      const topUc = Math.max(...affordable.map((p) => ucPerf(cat, p, useCaseKey)));
      const near = affordable.filter((p) => ucPerf(cat, p, useCaseKey) >= topUc * 0.93);
      near.sort((a, b) => a.price - b.price);
      chosen = near[0] || affordable[0];
    }
    parts[cat] = chosen;
    spent += chosen.price;
    return chosen;
  };

  const cpu = pick("cpu", CATALOG.cpu, target.cpu);
  pick("mobo", CATALOG.mobo.filter((m) => m.socket === cpu.socket), target.mobo);
  const mobo = parts.mobo;
  pick("ram", CATALOG.ram.filter((r) => r.ramType === mobo.ramType && r.cap <= mobo.maxRam), target.ram);
  pick("cooler", CATALOG.cooler.filter((c) => c.sockets.includes(cpu.socket) && c.tdpRating >= cpu.tdp), target.cooler);
  pick("storage", CATALOG.storage.filter((s) => (s.iface === "M.2" ? mobo.m2 >= 1 : true)), target.storage);
  if (alloc.gpu > 0) pick("gpu", CATALOG.gpu, target.gpu);

  // PSU sized to the build
  const need = requiredWatts(parts);
  let psuPool = CATALOG.psu.filter((p) => p.watt >= need * 1.25);
  if (psuPool.length === 0) psuPool = CATALOG.psu;
  pick("psu", psuPool, target.psu);

  // Case fitting the chosen mobo / gpu / air cooler
  let casePool = CATALOG.case.filter(
    (cs) =>
      cs.forms.includes(mobo.form) &&
      (!parts.gpu || parts.gpu.len <= cs.maxGpu) &&
      (parts.cooler.type !== "air" || parts.cooler.height <= cs.maxCool)
  );
  if (casePool.length === 0) casePool = CATALOG.case.filter((cs) => cs.forms.includes(mobo.form));
  if (casePool.length === 0) casePool = CATALOG.case;
  pick("case", casePool, target.case);

  // ---- reallocate leftover budget to the highest build-impact upgrades ----
  // After buying value parts, spend what's left where it helps the build most per
  // dollar (usually the CPU/GPU/RAM) instead of leaving money on the table.
  const totalCost = () => Object.values(parts).reduce((s, p) => s + (p ? p.price : 0), 0);
  const upgradeOnce = () => {
    let best = null;
    for (const cat of CATEGORY_ORDER) {
      const cur = parts[cat];
      if (!cur) continue;
      const w = (alloc[cat] || 0) / 100; // how much this category matters for the use case
      if (w <= 0) continue;
      const maxp = ucMaxPerf(cat, useCaseKey) || 1;
      for (const cand of CATALOG[cat]) {
        const extra = cand.price - cur.price;
        if (extra <= 0) continue;
        const rawGain = ucPerf(cat, cand, useCaseKey) - ucPerf(cat, cur, useCaseKey);
        if (rawGain <= 0) continue;
        if (totalCost() - cur.price + cand.price > budget) continue;
        if (checkCompat({ ...parts, [cat]: cand }).issues.length > 0) continue;
        const gain = (rawGain / maxp) * w; // contribution to overall performance
        const eff = gain / extra;          // build-impact per dollar
        if (!best || eff > best.eff || (Math.abs(eff - best.eff) < 1e-9 && gain > best.gain)) best = { cat, cand, eff, gain };
      }
    }
    if (best) { parts[best.cat] = best.cand; return true; }
    return false;
  };
  let guard = 0;
  while (upgradeOnce() && guard++ < 60) {}

  return parts;
}

/* ----------------------------- STORAGE WRAPPER ----------------------------- */
// Uses the artifact persistent storage API when present; falls back to an
// in-memory object so the app never crashes in a preview.
const memStore = {};
const LS = () => { try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } };
async function sSet(key, val) {
  try { if (typeof window !== "undefined" && window.storage) { await window.storage.set(key, JSON.stringify(val)); return; } } catch (e) {}
  try { const ls = LS(); if (ls) { ls.setItem(key, JSON.stringify(val)); return; } } catch (e) {}
  memStore[key] = JSON.stringify(val);
}
async function sDel(key) {
  try { if (typeof window !== "undefined" && window.storage) { await window.storage.delete(key); return; } } catch (e) {}
  try { const ls = LS(); if (ls) { ls.removeItem(key); return; } } catch (e) {}
  delete memStore[key];
}
async function sList(prefix) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.list(prefix);
      const keys = (r && r.keys) || [];
      return keys.map((k) => (typeof k === "string" ? k : k.key));
    }
  } catch (e) {}
  try { const ls = LS(); if (ls) return Object.keys(ls).filter((k) => k.startsWith(prefix)); } catch (e) {}
  return Object.keys(memStore).filter((k) => k.startsWith(prefix));
}
async function sGet(key) {
  try { if (typeof window !== "undefined" && window.storage) { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } } catch (e) {}
  try { const ls = LS(); if (ls) { const v = ls.getItem(key); return v ? JSON.parse(v) : null; } } catch (e) {}
  return memStore[key] ? JSON.parse(memStore[key]) : null;
}

/* ----------------------------- HOOKS / SMALL UI ----------------------------- */
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  const raf = useRef();
  useEffect(() => {
    let start;
    cancelAnimationFrame(raf.current);
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setV(target);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

function Gauge({ value, max = 100, size = 132, label, accent = "var(--c-accent)", delay = 0 }) {
  const v = useCountUp(value, 1100);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - clamp(v / max, 0, 1));
  return (
    <div className="rf-gauge" style={{ width: size, height: size, animationDelay: delay + "ms" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--c-track)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={accent} strokeWidth="10" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.2s linear", filter: `drop-shadow(0 0 8px ${accent})` }}
        />
      </svg>
      <div className="rf-gauge-center">
        <div className="rf-gauge-num" style={{ color: accent, fontSize: String(Math.round(v)).length >= 4 ? "26px" : undefined }}>{Math.round(v)}</div>
        <div className="rf-gauge-label">{label}</div>
      </div>
    </div>
  );
}

const scoreColor = (s) => (s >= 80 ? "var(--c-good)" : s >= 60 ? "var(--c-accent)" : s >= 40 ? "var(--c-warn)" : "var(--c-bad)");

/* ----------------------------- MAIN APP ----------------------------- */
export default function RigForge() {
  const [view, setView] = useState("home"); // home | survey | budget | results
  const [useCase, setUseCase] = useState(null);
  const [budget, setBudget] = useState(1200);
  const [parts, setParts] = useState(null);
  const [picker, setPicker] = useState(null); // category being swapped
  const [expanded, setExpanded] = useState({});
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [nameDraft, setNameDraft] = useState("");
  const [savingOpen, setSavingOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);
  const [theme, setTheme] = useState("dark"); // default dark mode
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await sGet("rf:theme");
      if (t === "light" || t === "dark") setTheme(t);
    })();
  }, []);
  const changeTheme = (t) => { setTheme(t); sSet("rf:theme", t); setSettingsOpen(false); };

  useEffect(() => {
    if (!settingsOpen) return;
    const h = () => setSettingsOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [settingsOpen]);

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Pull live prices and override the built-in sample prices. Fails silently
  // (keeps sample prices) when the endpoint isn't reachable, e.g. inside Claude.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PRICES_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data || !data.prices) return;
        let n = 0;
        for (const c of CATEGORY_ORDER) {
          for (const part of CATALOG[c]) {
            const entry = data.prices[part.id];
            if (entry) {
              const vals = Object.values(entry).filter((v) => typeof v === "number" && v > 0);
              if (vals.length) { part.price = Math.min(...vals); n++; }
            }
          }
        }
        if (n) setPriceInfo({ updatedAt: data.updatedAt, count: n });
      } catch (e) {
        /* offline / not deployed: keep built-in sample prices */
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const toggleFs = () => {
    try {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
        if (p && p.catch) p.catch(() => {});
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      }
    } catch (e) {}
  };

  const refreshSaved = useCallback(async () => {
    setLoadingSaved(true);
    const keys = await sList("build:");
    const list = (await Promise.all(keys.map((k) => sGet(k)))).filter(Boolean);
    list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    setSaved(list);
    setLoadingSaved(false);
  }, []);
  useEffect(() => { refreshSaved(); }, [refreshSaved]);

  const analysis = useMemo(
    () => (parts && useCase ? analyzeBuild(parts, useCase, budget) : null),
    [parts, useCase, budget]
  );
  const verdict = useMemo(
    () => (parts && analysis ? generateVerdict(parts, analysis, useCase, budget) : ""),
    [parts, analysis, useCase, budget]
  );

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const startSurvey = () => { setUseCase(null); setView("survey"); };
  const chooseUseCase = (k) => { setUseCase(k); setView("budget"); };
  const generateAuto = () => { setParts(assembleBuild(useCase, budget)); setExpanded({}); setView("results"); };
  const startManual = () => { setParts({}); setExpanded({}); setView("results"); };

  const swapPart = (cat, part) => {
    setParts((p) => ({ ...p, [cat]: part }));
    setPicker(null);
  };
  const removePart = (cat) => setParts((p) => { const n = { ...p }; delete n[cat]; return n; });

  const saveBuild = async () => {
    const a = analyzeBuild(parts, useCase, budget);
    const build = {
      id: "b" + Date.now(),
      name: nameDraft.trim() || `${USE_CASES[useCase].label} Build`,
      useCase, budget, parts,
      total: a.total, overallScore: a.score, ppScore: a.ppScore, // frozen on save
      verdict: generateVerdict(parts, a, useCase, budget),
      compatPass: a.compat.pass,
      savedAt: Date.now(),
    };
    await sSet("build:" + build.id, build);
    setSavingOpen(false); setNameDraft("");
    await refreshSaved();
    flash("Build saved to your rigs");
    setView("home");
  };
  const deleteBuild = async (id) => { await sDel("build:" + id); await refreshSaved(); };
  const openSaved = (b) => { setUseCase(b.useCase); setBudget(b.budget); setParts(b.parts); setView("results"); };

  return (
    <div className={"rf-root" + (theme === "light" ? " rf-light" : "")}>
      <StyleBlock />
      <div className="rf-bg" />
      <div className="rf-grid" />

      <header className="rf-header">
        <div className="rf-brand" onClick={() => setView("home")}>
          <div className="rf-logo"><Zap size={18} /></div>
          <span>FORGE<span className="rf-accent">APC</span></span>
        </div>
        <div className="rf-header-right">
          {view !== "home" && (
            <button className="rf-ghost" onClick={() => setView("home")}>
              <ChevronLeft size={16} /> My Rigs
            </button>
          )}
          <div className="rf-settings-wrap">
            <button className="rf-ghost rf-fs-btn" onClick={(e) => { e.stopPropagation(); setSettingsOpen((o) => !o); }} title="Settings"><Settings size={16} /></button>
            {settingsOpen && (
              <div className="rf-settings-menu" onClick={(e) => e.stopPropagation()}>
                <div className="rf-settings-title">Theme</div>
                <div className="rf-theme-toggle">
                  <button className={"rf-theme-opt" + (theme === "dark" ? " active" : "")} onClick={() => changeTheme("dark")}><Moon size={14} /> Dark</button>
                  <button className={"rf-theme-opt" + (theme === "light" ? " active" : "")} onClick={() => changeTheme("light")}><Sun size={14} /> Light</button>
                </div>
              </div>
            )}
          </div>
          <button className="rf-ghost rf-fs-btn" onClick={toggleFs} title={isFs ? "Exit full screen" : "Full screen"}>
            {isFs ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      <main className="rf-main">
        {view === "home" && (
          <Home saved={saved} loading={loadingSaved} onNew={startSurvey} onOpen={openSaved} onDelete={deleteBuild} priceInfo={priceInfo} />
        )}
        {view === "survey" && <Survey onPick={chooseUseCase} />}
        {view === "budget" && (
          <BudgetStep useCase={useCase} budget={budget} setBudget={setBudget} onBack={() => setView("survey")} onAuto={generateAuto} onManual={startManual} />
        )}
        {view === "results" && parts && analysis && (
          <Results
            useCase={useCase} budget={budget} parts={parts} analysis={analysis} verdict={verdict}
            expanded={expanded} setExpanded={setExpanded}
            onSwap={(c) => setPicker(c)} onRemove={removePart}
            onRegen={generateAuto} onSave={() => setSavingOpen(true)}
          />
        )}
      </main>

      {picker && (
        <Picker
          cat={picker} current={parts[picker]} useCase={useCase} budget={budget} parts={parts}
          onClose={() => setPicker(null)} onPick={(p) => swapPart(picker, p)}
        />
      )}

      {savingOpen && (
        <div className="rf-modal-wrap" onClick={() => setSavingOpen(false)}>
          <div className="rf-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Name this rig</h3>
            <p className="rf-muted">It'll show up on your front page with its frozen scores.</p>
            <input
              className="rf-input" autoFocus value={nameDraft}
              placeholder={`${USE_CASES[useCase].label} Build`}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBuild()}
            />
            <div className="rf-modal-actions">
              <button className="rf-ghost" onClick={() => setSavingOpen(false)}>Cancel</button>
              <button className="rf-btn" onClick={saveBuild}><Save size={16} /> Save rig</button>
            </div>
          </div>
        </div>
      )}

      {!assistantOpen && (
        <button className="rf-fab" onClick={() => setAssistantOpen(true)}>
          <Sparkles size={18} /> Ask AI
        </button>
      )}
      <Assistant open={assistantOpen} onClose={() => setAssistantOpen(false)} useCase={useCase} budget={budget} parts={parts} />

      {toast && <div className="rf-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

/* ----------------------------- HOME ----------------------------- */
function Home({ saved, loading, onNew, onOpen, onDelete, priceInfo }) {
  return (
    <div className="rf-fade">
      <div className="rf-hero">
        <div className="rf-eyebrow">PART PICKER · COMPATIBILITY · SCORING</div>
        <h1>Forge the perfect rig<br /><span className="rf-accent">for what you actually do.</span></h1>
        <p className="rf-muted rf-hero-sub">
          Tell us your use case and budget. We score every part, auto-assemble a balanced build,
          check full compatibility, and grade the result out of 100.
        </p>
        <button className="rf-btn rf-btn-lg" onClick={onNew}><Plus size={18} /> Start a new build</button>
        <div className="rf-price-status">
          <span className="rf-db-count"><Boxes size={13} /> {CATALOG_COUNT} components in the database</span>
          <span className="rf-dot-sep">·</span>
          {priceInfo ? (
            <><span className="rf-live-dot" /> Live Best Buy prices · updated {new Date(priceInfo.updatedAt).toLocaleDateString()}</>
          ) : (
            <>sample prices (deploy the pricing function for live data)</>
          )}
        </div>
      </div>

      <div className="rf-section-head">
        <h2>My Rigs</h2>
        <span className="rf-muted">{saved.length} saved</span>
      </div>

      {loading ? (
        <div className="rf-muted rf-pad">Loading your rigs…</div>
      ) : saved.length === 0 ? (
        <div className="rf-empty">
          <Boxes size={30} className="rf-muted" />
          <p className="rf-muted">No rigs yet. Build one and save it here.</p>
        </div>
      ) : (
        <div className="rf-saved-grid">
          {saved.map((b, i) => {
            const UC = USE_CASES[b.useCase];
            return (
              <div key={b.id} className="rf-saved-card rf-pop" style={{ animationDelay: i * 60 + "ms" }} onClick={() => onOpen(b)}>
                <div className="rf-saved-top">
                  <div className="rf-saved-uc"><UC.Icon size={15} /> {UC.label}</div>
                  <button className="rf-icon-btn" onClick={(e) => { e.stopPropagation(); onDelete(b.id); }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="rf-saved-name">{b.name}</div>
                <div className="rf-saved-scores">
                  <div className="rf-mini-score">
                    <span className="rf-mini-num" style={{ color: scoreColor(b.overallScore / 10) }}>{b.overallScore}</span>
                    <span className="rf-mini-lbl">Perf</span>
                  </div>
                  <div className="rf-mini-score">
                    <span className="rf-mini-num" style={{ color: scoreColor(b.ppScore) }}>{b.ppScore}</span>
                    <span className="rf-mini-lbl">Price/Perf</span>
                  </div>
                  <div className="rf-saved-price">{fmt(b.total)}</div>
                </div>
                <div className="rf-saved-parts">
                  {CATEGORY_ORDER.map((c) => {
                    const pt = b.parts[c];
                    const noGpu = c === "gpu" && !pt && USE_CASES[b.useCase].alloc.gpu === 0;
                    if (!pt && !noGpu) return null;
                    return (
                      <div key={c} className="rf-saved-part">
                        <span className="rf-saved-part-cat">{CAT_META[c].label}</span>
                        <span className="rf-saved-part-name">{pt ? pt.name : "Integrated graphics"}</span>
                      </div>
                    );
                  })}
                </div>
                {!b.compatPass && <div className="rf-incompat"><ShieldAlert size={13} /> Has compatibility issues</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- SURVEY ----------------------------- */
function Survey({ onPick }) {
  return (
    <div className="rf-fade rf-step">
      <div className="rf-step-head">
        <div className="rf-eyebrow">STEP 1 OF 2</div>
        <h2>What will this PC be for?</h2>
        <p className="rf-muted">This sets which parts matter most and how your budget gets split.</p>
      </div>
      <div className="rf-uc-grid">
        {Object.entries(USE_CASES).map(([k, uc], i) => (
          <button key={k} className="rf-uc-card rf-pop" style={{ animationDelay: i * 55 + "ms" }} onClick={() => onPick(k)}>
            <div className="rf-uc-icon"><uc.Icon size={24} /></div>
            <div className="rf-uc-label">{uc.label}</div>
            <div className="rf-uc-tag">{uc.tag}</div>
            <div className="rf-uc-go"><ChevronRight size={16} /></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- BUDGET ----------------------------- */
function BudgetStep({ useCase, budget, setBudget, onBack, onAuto, onManual }) {
  const UC = USE_CASES[useCase];
  const MIN = 500, MAX = 4000;
  const pct = ((budget - MIN) / (MAX - MIN)) * 100;
  const presets = [700, 1200, 2000, 3000];
  return (
    <div className="rf-fade rf-step">
      <div className="rf-step-head">
        <div className="rf-eyebrow">STEP 2 OF 2 · {UC.label.toUpperCase()}</div>
        <h2>What's your budget?</h2>
        <p className="rf-muted">Drag to set your total spend. We reserve the essentials first, then spend the rest where it counts.</p>
      </div>

      <div className="rf-budget-display">{fmt(budget)}</div>

      <div className="rf-slider-wrap">
        <input
          type="range" min={MIN} max={MAX} step={50} value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="rf-slider"
          style={{ background: `linear-gradient(90deg, var(--c-accent) ${pct}%, var(--c-track) ${pct}%)` }}
        />
        <div className="rf-slider-ends"><span>{fmt(MIN)}</span><span>{fmt(MAX)}</span></div>
      </div>

      <div className="rf-presets">
        {presets.map((p) => (
          <button key={p} className={"rf-preset" + (budget === p ? " active" : "")} onClick={() => setBudget(p)}>{fmt(p)}</button>
        ))}
      </div>

      {/* live allocation preview */}
      <div className="rf-alloc">
        <div className="rf-alloc-title">How your {fmt(budget)} splits for {UC.label}</div>
        <div className="rf-alloc-bars">
          {CATEGORY_ORDER.filter((c) => UC.alloc[c] > 0).map((c) => (
            <div key={c} className="rf-alloc-row">
              <span className="rf-alloc-lbl">{CAT_META[c].label}</span>
              <div className="rf-alloc-track"><div className="rf-alloc-fill" style={{ width: UC.alloc[c] * 2.4 + "%" }} /></div>
              <span className="rf-alloc-val">{fmt((budget * UC.alloc[c]) / 100)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rf-forge-btns">
        <button type="button" className="rf-forge-btn primary" onClick={onAuto}>
          <Sparkles size={15} /> Auto-Forge
        </button>
        <button type="button" className="rf-forge-btn outline" onClick={onManual}>
          <Wrench size={15} /> Build It Yourself
        </button>
      </div>

      <div className="rf-step-actions center">
        <button type="button" className="rf-ghost" onClick={onBack}><ChevronLeft size={16} /> Back</button>
      </div>
    </div>
  );
}

/* ----------------------------- RESULTS ----------------------------- */
function Results({ useCase, budget, parts, analysis, verdict, expanded, setExpanded, onSwap, onRemove, onRegen, onSave }) {
  const UC = USE_CASES[useCase];
  const a = analysis;
  const overBudget = a.total > budget;
  return (
    <div className="rf-fade">
      <div className="rf-results-head">
        <div>
          <div className="rf-eyebrow"><UC.Icon size={13} /> {UC.label} · {fmt(budget)} budget</div>
          <h2>Your build</h2>
        </div>
        <div className="rf-results-actions">
          <button className="rf-ghost" onClick={onRegen}><Sparkles size={15} /> Auto-forge</button>
          <button className="rf-btn" onClick={onSave}><Save size={16} /> Save rig</button>
        </div>
      </div>

      {/* scorecard */}
      <div className="rf-scorecard rf-pop">
        <div className="rf-gauges">
          <Gauge value={a.score} max={1000} label="PERFORMANCE" accent={scoreColor(a.score / 10)} />
          <Gauge value={a.ppScore} label="PRICE / PERF" accent={scoreColor(a.ppScore)} delay={120} />
        </div>
        <div className="rf-verdict">
          <div className="rf-verdict-tag"><Sparkles size={13} /> AI verdict <span className="rf-hybrid">hybrid</span></div>
          <p>{verdict}</p>
          <div className="rf-total-row">
            <span className="rf-muted">Total</span>
            <span className={"rf-total" + (overBudget ? " over" : "")}>{fmt(a.total)}</span>
            <div className="rf-budget-bar">
              <div className="rf-budget-fill" style={{ width: clamp((a.total / budget) * 100, 0, 100) + "%", background: overBudget ? "var(--c-bad)" : "var(--c-accent)" }} />
            </div>
            <span className="rf-muted">{fmt(budget)}</span>
          </div>
        </div>
      </div>

      {/* compatibility banner */}
      <div className={"rf-compat " + (!a.compat.pass ? "bad" : !a.complete ? "warn" : "ok")}>
        {!a.compat.pass ? <ShieldAlert size={18} /> : !a.complete ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        <div>
          <strong>
            {!a.compat.pass
              ? `${a.compat.issues.length} compatibility issue${a.compat.issues.length > 1 ? "s" : ""}`
              : !a.complete
              ? `${a.missing.length} part${a.missing.length > 1 ? "s" : ""} still to add`
              : "All compatibility checks passed"}
          </strong>
          {!a.compat.pass && <ul>{a.compat.issues.map((m, i) => <li key={i}>{m}</li>)}</ul>}
          {a.compat.pass && !a.complete && (
            <span className="rf-compat-sub">{a.missing.map((c) => CAT_META[c].label).join(", ")}</span>
          )}
        </div>
      </div>

      {/* part list */}
      <div className="rf-parts">
        {CATEGORY_ORDER.map((cat, i) => {
          const part = parts[cat];
          const skip = UC.alloc[cat] === 0 && !part;
          const band = (budget * UC.alloc[cat]) / 100;
          const Meta = CAT_META[cat];
          const status = part ? budgetStatus(part.price, band) : "within";
          const compatible = part ? isPartCompatible(parts, cat) : true;
          const sc = part ? (compatible ? partScore({ ...part, cat }, band, useCase) : 0) : 0;
          const isOpen = expanded[cat];
          return (
            <div key={cat} className="rf-part rf-pop" style={{ animationDelay: i * 45 + "ms" }}>
              <div className="rf-part-top">
                <div className="rf-part-icon"><Meta.Icon size={20} /></div>
                <div className="rf-part-info">
                  <div className="rf-part-cat">{Meta.label}</div>
                  {part ? (
                    <div className="rf-part-name">{part.name}</div>
                  ) : skip ? (
                    <div className="rf-part-name rf-muted">Integrated graphics — no discrete GPU</div>
                  ) : (
                    <div className="rf-part-name rf-muted">Empty</div>
                  )}
                </div>

                {part && (
                  <>
                    <div className="rf-part-price-col">
                      <div className={"rf-part-price " + status}>{fmt(part.price)}</div>
                      {status === "over" && <div className="rf-flag over">OVER BUDGET</div>}
                      {status === "tight" && <div className="rf-flag tight">A bit over</div>}
                    </div>
                    <div className="rf-part-score" style={{ borderColor: scoreColor(sc), color: scoreColor(sc) }}>{sc}</div>
                  </>
                )}
              </div>

              <div className="rf-part-actions">
                {part && (
                  <button className="rf-chip-btn" onClick={() => setExpanded((e) => ({ ...e, [cat]: !e[cat] }))}>
                    {isOpen ? <ChevronLeft size={13} style={{ transform: "rotate(90deg)" }} /> : <Sparkles size={13} />}
                    {isOpen ? "Hide info" : "More info"}
                  </button>
                )}
                <button className="rf-chip-btn primary" onClick={() => onSwap(cat)}><Repeat2 size={13} /> {part ? "Swap" : "Add"}</button>
              </div>

              {part && isOpen && <InfoPanel cat={cat} part={part} band={band} status={status} useCase={useCase} incompatible={!compatible} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------- General facts + a personalized "for you" note ------- */
function partFacts(cat, part) {
  switch (cat) {
    case "cpu": return [`${part.cores} cores`, `${part.socket} socket`, `${part.tdp}W TDP`, part.igpu ? "Integrated graphics" : "Needs a GPU"];
    case "gpu": return [`${part.vram}GB VRAM`, `${part.tdp}W draw`, `${part.len}mm long`];
    case "mobo": return [`${part.socket}`, `${part.ramType}`, `${part.form}`, `${part.m2} M.2 slot${part.m2 > 1 ? "s" : ""}`];
    case "ram": return [`${part.cap}GB`, `${part.ramType}`, `${part.speed} MT/s`];
    case "storage": return [`${part.cap >= 1000 ? part.cap / 1000 + "TB" : part.cap + "GB"}`, `${part.kind}`, `${part.iface}`];
    case "psu": return [`${part.watt}W`, `80+ ${part.eff}`];
    case "case": return [`Fits ${part.forms.join("/")}`, `GPU ≤ ${part.maxGpu}mm`, `Cooler ≤ ${part.maxCool}mm`];
    case "cooler": return [`${part.type.toUpperCase()}`, `${part.tdpRating}W rated`, part.type === "air" ? `${part.height}mm tall` : "Liquid"];
    default: return [];
  }
}
function partProsCons(cat, part, band, status, useCase) {
  const pros = [];
  const cons = [];
  const ratio = ucPerf(cat, part, useCase) / ucMaxPerf(cat, useCase);
  const high = ratio >= 0.8;
  const mid = ratio >= 0.5 && ratio < 0.8;
  const low = ratio < 0.4;
  const uc = USE_CASES[useCase];
  const ucLabel = uc.label.toLowerCase();

  // budget — requested behaviour: over budget shows up as a con
  if (status === "over") cons.push("Over budget");
  else if (status === "tight") cons.push(`Slightly over your ${fmt(band)} budget slice`);
  else pros.push(`Fits your ${fmt(band)} budget slice`);

  // performance tier
  if (high) pros.push("Top-tier performance in its class");
  else if (mid) pros.push("Solid mid-range performance");
  if (low) cons.push("Entry-level performance");

  switch (cat) {
    case "cpu":
      if (part.cores >= 12) pros.push(`${part.cores} cores — great for multitasking & productivity`);
      if (part.igpu) pros.push("Integrated graphics — runs without a GPU");
      else cons.push("No integrated graphics — needs a discrete GPU");
      if (part.tdp >= 150) cons.push(`High ${part.tdp}W power draw — wants strong cooling`);
      if (uc.alloc.gpu === 0 && !part.igpu) cons.push("No iGPU — unsuitable for a GPU-less office build");
      break;
    case "gpu":
      if (part.vram >= 16) pros.push(`${part.vram}GB VRAM — strong for high-res & AI work`);
      if (part.vram <= 8) cons.push(`Only ${part.vram}GB VRAM — limiting at 1440p+ and for AI`);
      if (part.tdp >= 280) cons.push(`High ${part.tdp}W draw — needs a beefy PSU & airflow`);
      if (part.len >= 320) cons.push(`${part.len}mm long — check case clearance`);
      if (["gaming", "ai"].includes(useCase) && high) pros.push(`Excellent match for ${ucLabel}`);
      if (uc.alloc.gpu === 0) cons.push("Unnecessary for office use — integrated graphics suffice");
      break;
    case "mobo":
      if (part.m2 >= 3) pros.push(`${part.m2} M.2 slots — room for multiple fast drives`);
      if (part.maxRam >= 192) pros.push(`Supports up to ${part.maxRam}GB RAM`);
      if (part.form === "ITX") cons.push("ITX — limited expansion & RAM slots");
      pros.push(`${part.ramType} platform`);
      break;
    case "ram":
      if (part.cap >= 32) pros.push(`${part.cap}GB — comfortable for demanding workloads`);
      if (part.cap <= 16) cons.push(`${part.cap}GB — tight for heavy multitasking`);
      if (part.ramType === "DDR5" && part.speed >= 6000) pros.push(`Fast ${part.speed} MT/s DDR5`);
      if (part.ramType === "DDR4") cons.push("Older DDR4 standard (end-of-life platform)");
      if (part.price >= 600) cons.push("Expensive — memory-shortage premium");
      break;
    case "storage":
      if (part.kind === "NVMe") pros.push("Fast NVMe (M.2)");
      if (part.kind === "SATA") cons.push("Slower SATA interface");
      if (part.cap >= 2000) pros.push(`${part.cap / 1000}TB — plenty of space`);
      if (part.cap <= 1000) cons.push("1TB — can fill up fast with large games");
      break;
    case "psu":
      if (["Gold", "Platinum", "Titanium"].includes(part.eff)) pros.push(`Efficient 80+ ${part.eff}`);
      if (part.eff === "Bronze") cons.push("Basic 80+ Bronze efficiency");
      if (part.watt >= 1000) pros.push(`${part.watt}W — ample headroom for top GPUs`);
      if (part.watt <= 550) cons.push(`${part.watt}W — limited headroom for big builds`);
      break;
    case "case":
      if (part.maxGpu >= 380) pros.push("Fits very long GPUs");
      if (part.maxCool >= 170) pros.push("Room for tall coolers / big radiators");
      if (part.forms.length === 1 && part.forms[0] === "ITX") cons.push("ITX-only — tight build, limited clearance");
      break;
    case "cooler":
      if (part.type === "aio") pros.push("AIO liquid — strong, quiet cooling");
      if (part.tdpRating >= 250) pros.push(`Handles up to ${part.tdpRating}W CPUs`);
      if (part.type === "air" && part.tdpRating <= 95) cons.push("Limited cooling — not for hot CPUs");
      if (part.type === "air" && part.height >= 160) cons.push(`${part.height}mm tall — check case clearance`);
      break;
    default:
      break;
  }

  if (pros.length === 0) pros.push("Gets the job done for the price");
  if (cons.length === 0) cons.push("No notable downsides for this build");
  return { pros, cons };
}

function InfoPanel({ cat, part, band, status, useCase, compact, incompatible }) {
  const facts = partFacts(cat, part);
  const { pros, cons } = partProsCons(cat, part, band, status, useCase);
  const allCons = incompatible ? ["Not compatible with your current build", ...cons] : cons;
  const strong = (c) => c === "Over budget" || c === "Not compatible with your current build";
  return (
    <div className={"rf-info rf-slidein" + (compact ? " compact" : "")}>
      <div className="rf-info-specs">
        <div className="rf-info-h">SPECS</div>
        <div className="rf-info-facts">{facts.map((f, i) => <span key={i} className="rf-fact">{f}</span>)}</div>
      </div>
      <div className="rf-pc-head"><Sparkles size={12} /> AI PROS &amp; CONS <span className="rf-hybrid">auto</span></div>
      <div className="rf-pc-grid">
        <div>
          <div className="rf-pc-h pros">PROS</div>
          <ul className="rf-pc-list">
            {pros.map((p, i) => <li key={i} className="rf-pc pro"><Check size={13} /> {p}</li>)}
          </ul>
        </div>
        <div>
          <div className="rf-pc-h cons">CONS</div>
          <ul className="rf-pc-list">
            {allCons.map((c, i) => (
              <li key={i} className={"rf-pc con" + (strong(c) ? " strong" : "")}><X size={13} /> {c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- PART PICKER DRAWER ----------------------------- */
function Picker({ cat, current, useCase, budget, parts, onClose, onPick }) {
  const Meta = CAT_META[cat];
  const band = (budget * USE_CASES[useCase].alloc[cat]) / 100;
  const [openId, setOpenId] = useState(null);      // variant id with "More info" open
  const [openModel, setOpenModel] = useState(null); // model group expanded to variants

  const models = useMemo(() => {
    const rest = { ...parts };
    delete rest[cat];
    const baseIssues = checkCompat(rest).issues.length;
    const scored = CATALOG[cat].map((p) => {
      const res = checkCompat({ ...rest, [cat]: p });
      const adds = res.issues.length > baseIssues;
      return {
        ...p,
        _score: adds ? 0 : partScore({ ...p, cat }, band, useCase),
        _status: budgetStatus(p.price, band),
        _compat: !adds,
        _issues: res.issues,
      };
    });
    const groups = {};
    for (const v of scored) {
      const key = v.model || v.name;
      (groups[key] = groups[key] || []).push(v);
    }
    const list = Object.entries(groups).map(([model, variants]) => {
      variants.sort((a, b) => b._score - a._score || a.price - b.price);
      const prices = variants.map((v) => v.price);
      const rep = variants[0];
      return {
        model,
        variants,
        rep,
        single: variants.length === 1,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        score: rep._score,
        compat: variants.some((v) => v._compat),
        hasCurrent: current && variants.some((v) => v.id === current.id),
      };
    });
    list.sort((a, b) => b.score - a.score || a.minPrice - b.minPrice);
    return list;
  }, [cat, parts, band, useCase, current]);

  const VariantActions = ({ v }) => {
    const open = openId === v.id;
    const isCur = current && current.id === v.id;
    return (
      <>
        <div className="rf-pick-actions">
          <button className="rf-chip-btn" onClick={() => setOpenId(open ? null : v.id)}>
            {open ? <ChevronLeft size={13} style={{ transform: "rotate(90deg)" }} /> : <Sparkles size={13} />}
            {open ? "Hide info" : "More info"}
          </button>
          <button className="rf-chip-btn primary" onClick={() => onPick(v)}>{isCur ? "Selected" : "Select"}</button>
        </div>
        {open && <InfoPanel cat={cat} part={v} band={band} status={v._status} useCase={useCase} compact incompatible={!v._compat} />}
      </>
    );
  };

  return (
    <div className="rf-drawer-wrap" onClick={onClose}>
      <div className="rf-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="rf-drawer-head">
          <div>
            <div className="rf-eyebrow"><Meta.Icon size={13} /> CHOOSE A {Meta.label.toUpperCase()}</div>
            <div className="rf-muted rf-sm">{CATALOG[cat].length} options · sorted by your match score · budget slice {fmt(band)}</div>
          </div>
          <button className="rf-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="rf-drawer-list">
          {models.map((g) => {
            const expanded = openModel === g.model;
            const priceLabel = g.single || g.minPrice === g.maxPrice ? fmt(g.minPrice) : `${fmt(g.minPrice)}–${fmt(g.maxPrice)}`;
            return (
              <div key={g.model} className={"rf-pick" + (g.hasCurrent ? " current" : "")}>
                <div
                  className={"rf-pick-row" + (g.single ? "" : " rf-clickable")}
                  onClick={g.single ? undefined : () => setOpenModel(expanded ? null : g.model)}
                >
                  <div className="rf-pick-score" style={{ borderColor: scoreColor(g.score), color: scoreColor(g.score) }}>{g.score}</div>
                  <div className="rf-pick-info">
                    <div className="rf-pick-name">
                      {g.model}
                      {!g.single && <span className="rf-variant-count">{g.variants.length} models</span>}
                      {g.hasCurrent && <span className="rf-cur-tag">current</span>}
                    </div>
                    <div className="rf-pick-facts">{partFacts(cat, g.rep).slice(0, 3).join(" · ")}</div>
                    {!g.compat && <div className="rf-pick-warn"><AlertTriangle size={12} /> {g.rep._issues[0]}</div>}
                  </div>
                  <div className="rf-pick-right">
                    <div className={"rf-part-price " + (g.single ? g.rep._status : "")}>{priceLabel}</div>
                    {g.compat ? <ShieldCheck size={14} className="rf-compat-ok" /> : <ShieldAlert size={14} className="rf-compat-bad" />}
                  </div>
                </div>

                {g.single ? (
                  <VariantActions v={g.rep} />
                ) : (
                  <div className="rf-pick-actions">
                    <button className="rf-chip-btn" onClick={() => setOpenModel(expanded ? null : g.model)}>
                      <ChevronLeft size={13} style={{ transform: expanded ? "rotate(90deg)" : "rotate(-90deg)" }} />
                      {expanded ? "Hide models" : `Show ${g.variants.length} models`}
                    </button>
                  </div>
                )}

                {!g.single && expanded && (
                  <div className="rf-variants">
                    {g.variants.map((v) => (
                      <div key={v.id} className={"rf-variant" + (current && current.id === v.id ? " current" : "")}>
                        <div className="rf-variant-row">
                          <div className="rf-pick-score sm" style={{ borderColor: scoreColor(v._score), color: scoreColor(v._score) }}>{v._score}</div>
                          <div className="rf-variant-name">{v.variantLabel || v.brand}</div>
                          <div className="rf-variant-right">
                            <span className={"rf-part-price " + v._status}>{fmt(v.price)}</span>
                            {v._status === "over" && <span className="rf-flag over">OVER</span>}
                            {!v._compat && <ShieldAlert size={13} className="rf-compat-bad" />}
                          </div>
                        </div>
                        <VariantActions v={v} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- AI ASSISTANT ----------------------------- */
const SUGGESTIONS = [
  "Is my build balanced?",
  "What should I upgrade first?",
  "Best value GPU for my budget?",
  "Why is RAM so expensive right now?",
];

// Try the strongest model first; fall back if the environment doesn't allow it.
const ASSISTANT_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-sonnet-4-20250514"];
const CHAT_URL = "/api/chat"; // your serverless function that holds the Anthropic key

async function streamChat({ system, messages }, onDelta) {
  // 1) Deployed site: our own backend answers and keeps the API key server-side.
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = (data && data.text ? data.text : "").trim();
      if (text) { onDelta(text); return text; } // smooth typewriter reveals it
    }
  } catch (e) {
    /* no backend reachable (e.g. the Claude preview) — fall through to the direct call */
  }

  // 2) Fallback: call Anthropic directly (works inside the Claude preview).
  let lastErr;
  for (const model of ASSISTANT_MODELS) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 600, system, stream: true, messages }),
      });
      if (!res.ok || !res.body) throw new Error("status " + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", raw = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        raw += chunk; buf += chunk;
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const p = t.slice(5).trim();
          if (!p || p === "[DONE]") continue;
          try {
            const evt = JSON.parse(p);
            if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
              acc += evt.delta.text;
              onDelta(acc);
            }
          } catch (e) {}
        }
      }
      if (!acc) {
        try {
          const data = JSON.parse(raw);
          const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
          if (text) { acc = text; onDelta(acc); }
        } catch (e) {}
      }
      if (acc) return acc;
      lastErr = new Error("empty response");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("request failed");
}

function Assistant({ open, onClose, useCase, budget, parts }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const targetRef = useRef("");   // full text received from the stream so far
  const shownRef = useRef(0);     // chars currently revealed
  const doneRef = useRef(false);  // network stream finished
  const rafRef = useRef(0);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Reveal buffered text at a steady, smooth pace regardless of network bursts.
  const tick = () => {
    const target = targetRef.current;
    if (shownRef.current < target.length) {
      const remaining = target.length - shownRef.current;
      const step = Math.max(2, Math.min(4, Math.ceil(remaining / 25))); // steady, smooth cadence
      shownRef.current = Math.min(target.length, shownRef.current + step);
      const shown = target.slice(0, shownRef.current);
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", text: shown };
        return c;
      });
    }
    if (doneRef.current && shownRef.current >= target.length) {
      setStreaming(false);
      rafRef.current = 0;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const buildContext = () => {
    const hasBuild = parts && Object.keys(parts).some((k) => parts[k]);
    if (!hasBuild) return "The user hasn't assembled a build yet.";
    const ucLabel = useCase ? USE_CASES[useCase].label : "unspecified";
    const lines = CATEGORY_ORDER.filter((c) => parts[c]).map(
      (c) => `- ${CAT_META[c].label}: ${parts[c].name} ($${parts[c].price})`
    );
    const total = CATEGORY_ORDER.reduce((s, c) => s + (parts[c]?.price || 0), 0);
    let extra = "";
    if (useCase) {
      const a = analyzeBuild(parts, useCase, budget);
      extra =
        `Performance score ${a.score}/1000, price-to-performance ${a.ppScore}/100. ` +
        `Total $${total} of a $${budget} budget. ` +
        `Compatibility: ${a.compat.pass ? "all checks pass" : a.compat.issues.join("; ")}.`;
    }
    return `Use case: ${ucLabel}. Budget: $${budget}.\nParts:\n${lines.join("\n")}\n${extra}`;
  };

  const send = async (preset) => {
    const q = (preset ?? input).trim();
    if (!q || loading || streaming) return;
    const next = [...messages, { role: "user", text: q }];
    const payload = next.map((m) => ({ role: m.role, content: m.text }));
    setMessages([...next, { role: "assistant", text: "" }]);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setError(null);
    targetRef.current = "";
    shownRef.current = 0;
    doneRef.current = false;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    const system =
      "You are the built-in AI assistant for FORGEAPC, a PC-part-picker app. " +
      "Help with the user's build: components, compatibility, bottlenecks, and which parts fit their needs and budget. " +
      "Keep answers short and practical — usually 2-4 sentences. Use a short bullet list only if it genuinely helps. No fluff or filler. " +
      "Context: as of mid-2026 a severe AI-driven memory/storage shortage makes RAM and SSDs very expensive (64GB DDR5 ~$850, 32GB ~$470, 1TB SSD ~$165). " +
      "DDR5-6000 CL30 is the value sweet spot; 6400/7200 is poor value; motherboards above ~$250 are usually overkill. Factor this in.\n\n" +
      "The user's current build:\n" +
      buildContext();
    try {
      await streamChat({ system, messages: payload }, (full) => { targetRef.current = full; });
      doneRef.current = true; // reveal loop will finish the remaining buffered text, then stop
    } catch (e) {
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setStreaming(false);
      setError("Couldn't reach the assistant. Please try again.");
      setMessages((m) => (m.length && m[m.length - 1].role === "assistant" && !m[m.length - 1].text ? m.slice(0, -1) : m));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="rf-assistant">
      <div className="rf-asst-head">
        <div className="rf-asst-title"><div className="rf-asst-avatar"><Bot size={16} /></div> AI Assistant</div>
        <button className="rf-icon-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="rf-asst-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="rf-asst-welcome">
            <div className="rf-asst-avatar big"><Sparkles size={20} /></div>
            <p>Ask me anything about your build or PC parts in general — I can see your current rig.</p>
            <div className="rf-asst-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="rf-asst-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isStreamingMsg = streaming && i === messages.length - 1 && m.role === "assistant";
          return (
            <div key={i} className={"rf-msg " + m.role}>
              {m.role === "assistant" && <div className="rf-asst-avatar sm"><Bot size={13} /></div>}
              <div className="rf-bubble">
                {m.text ? (
                  <>{m.text}{isStreamingMsg && <span className="rf-cursor" />}</>
                ) : isStreamingMsg ? (
                  <span className="rf-typing"><span></span><span></span><span></span></span>
                ) : null}
              </div>
            </div>
          );
        })}
        {error && <div className="rf-asst-error">{error}</div>}
      </div>

      <div className="rf-asst-input">
        <input
          value={input}
          placeholder="Ask about your build…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="rf-asst-send" onClick={() => send()} disabled={loading || streaming || !input.trim()}><Send size={16} /></button>
      </div>
    </div>
  );
}

/* ----------------------------- STYLES ----------------------------- */
function StyleBlock() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');

.rf-root{--c-bg:#070a0f;--c-panel:rgba(255,255,255,0.035);--c-panel-2:rgba(255,255,255,0.06);
--c-border:rgba(255,255,255,0.09);--c-text:#e8edf4;--c-muted:#7c8798;
--c-accent:#2ee6cf;--c-accent2:#7c5cff;--c-good:#46e0a0;--c-warn:#ffc24b;--c-bad:#ff5c72;
--c-track:rgba(255,255,255,0.08);--c-hover:rgba(255,255,255,0.2);--c-grid:rgba(255,255,255,0.035);
position:relative;min-height:100vh;width:100%;background:var(--c-bg);color:var(--c-text);
font-family:'Sora',system-ui,sans-serif;overflow-x:hidden;}
.rf-root.rf-light{--c-bg:#eef1f6;--c-panel:rgba(15,28,50,0.04);--c-panel-2:rgba(15,28,50,0.08);
--c-border:rgba(15,28,50,0.14);--c-text:#101826;--c-muted:#566273;
--c-accent:#0bb6a0;--c-accent2:#6a4cf0;--c-good:#12a06a;--c-warn:#b8770a;--c-bad:#e23a52;
--c-track:rgba(15,28,50,0.12);--c-hover:rgba(15,28,50,0.24);--c-grid:rgba(15,28,50,0.05);}
.rf-root *{box-sizing:border-box;}
.rf-bg{position:fixed;inset:0;pointer-events:none;z-index:0;
background:radial-gradient(900px 600px at 78% -8%,rgba(124,92,255,0.18),transparent 60%),
radial-gradient(800px 600px at 10% 8%,rgba(46,230,207,0.14),transparent 55%);}
.rf-grid{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.4;
background-image:linear-gradient(var(--c-grid) 1px,transparent 1px),linear-gradient(90deg,var(--c-grid) 1px,transparent 1px);
background-size:46px 46px;mask-image:radial-gradient(circle at 50% 0%,black,transparent 75%);}
.rf-header{position:relative;z-index:30;display:flex;align-items:center;justify-content:space-between;
padding:20px 26px;max-width:1080px;margin:0 auto;}
.rf-header-right{display:flex;align-items:center;gap:10px;}
.rf-settings-wrap{position:relative;z-index:60;}
.rf-settings-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:300;background:var(--c-bg);
border:1px solid var(--c-border);border-radius:14px;padding:14px;min-width:180px;
box-shadow:0 18px 50px rgba(0,0,0,0.45);}
.rf-settings-title{font-family:'JetBrains Mono';font-size:10px;letter-spacing:1.5px;text-transform:uppercase;
color:var(--c-muted);margin-bottom:10px;}
.rf-theme-toggle{display:flex;gap:6px;background:var(--c-panel);border:1px solid var(--c-border);border-radius:10px;padding:4px;}
.rf-theme-opt{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
background:transparent;border:none;color:var(--c-muted);font-family:'Sora';font-size:13px;font-weight:600;
padding:8px 10px;border-radius:8px;cursor:pointer;transition:.15s;}
.rf-theme-opt.active{background:var(--c-accent);color:#04110f;}
.rf-theme-opt:not(.active):hover{color:var(--c-text);background:var(--c-panel-2);}
.rf-fs-btn{padding:9px 11px;}
.rf-brand{display:flex;align-items:center;gap:10px;font-family:'Chakra Petch';font-weight:700;
font-size:20px;letter-spacing:1px;cursor:pointer;}
.rf-logo{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:#04110f;
background:linear-gradient(135deg,var(--c-accent),#19b89f);box-shadow:0 0 18px rgba(46,230,207,0.5);}
.rf-accent{color:var(--c-accent);}
.rf-main{position:relative;z-index:2;max-width:1080px;margin:0 auto;padding:8px 26px 90px;}
.rf-muted{color:var(--c-muted);}
.rf-sm{font-size:12.5px;}
.rf-pad{padding:30px 0;}

.rf-btn{display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;
background:linear-gradient(135deg,var(--c-accent),#19b89f);color:#04110f;font-weight:600;
font-family:'Sora';font-size:14px;padding:11px 18px;border-radius:11px;
box-shadow:0 6px 22px rgba(46,230,207,0.28);transition:transform .18s,box-shadow .18s,filter .18s;}
.rf-btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(46,230,207,0.42);filter:brightness(1.05);}
.rf-btn:active{transform:translateY(0);}
.rf-btn-lg{font-size:15.5px;padding:14px 26px;border-radius:13px;}
.rf-ghost{display:inline-flex;align-items:center;gap:6px;background:var(--c-panel);border:1px solid var(--c-border);
color:var(--c-text);font-family:'Sora';font-size:13.5px;padding:9px 15px;border-radius:10px;cursor:pointer;transition:.18s;}
.rf-ghost:hover{background:var(--c-panel-2);border-color:var(--c-hover);}
.rf-icon-btn{background:transparent;border:none;color:var(--c-muted);cursor:pointer;padding:6px;border-radius:8px;transition:.15s;display:grid;place-items:center;}
.rf-icon-btn:hover{color:var(--c-bad);background:rgba(255,92,114,0.1);}

.rf-eyebrow{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono';font-size:11px;
letter-spacing:2px;color:var(--c-accent);margin-bottom:12px;}
h1{font-family:'Chakra Petch';font-weight:700;font-size:clamp(30px,5vw,46px);line-height:1.08;margin:0 0 16px;letter-spacing:-0.5px;}
h2{font-family:'Chakra Petch';font-weight:600;font-size:25px;margin:0;letter-spacing:0.3px;}
h3{font-family:'Chakra Petch';font-weight:600;font-size:18px;margin:0 0 6px;}

/* HERO */
.rf-hero{padding:34px 0 14px;}
.rf-hero-sub{max-width:560px;font-size:15px;line-height:1.6;margin:0 0 26px;}
.rf-price-status{display:flex;align-items:center;gap:8px;margin-top:16px;font-size:12px;color:var(--c-muted);font-family:'JetBrains Mono';letter-spacing:0.3px;flex-wrap:wrap;}
.rf-db-count{display:inline-flex;align-items:center;gap:6px;color:var(--c-accent);}
.rf-dot-sep{opacity:0.5;}
.rf-live-dot{width:8px;height:8px;border-radius:50%;background:var(--c-good);box-shadow:0 0 8px var(--c-good);animation:rfPulseDot 1.8s ease-in-out infinite;}
@keyframes rfPulseDot{0%,100%{opacity:1}50%{opacity:0.35}}
.rf-section-head{display:flex;align-items:baseline;justify-content:space-between;margin:38px 0 16px;border-top:1px solid var(--c-border);padding-top:24px;}
.rf-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:46px;border:1px dashed var(--c-border);border-radius:16px;text-align:center;}

/* SAVED */
.rf-saved-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:16px;}
.rf-saved-card{background:var(--c-panel);border:1px solid var(--c-border);border-radius:16px;padding:20px;cursor:pointer;transition:transform .2s,border-color .2s,background .2s;}
.rf-saved-card:hover{transform:translateY(-3px);border-color:rgba(46,230,207,0.4);background:var(--c-panel-2);}
.rf-saved-parts{margin-top:15px;padding-top:14px;border-top:1px solid var(--c-border);display:flex;flex-direction:column;gap:6px;}
.rf-saved-part{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:12.5px;}
.rf-saved-part-cat{color:var(--c-muted);font-family:'JetBrains Mono';font-size:10px;letter-spacing:0.5px;text-transform:uppercase;flex-shrink:0;}
.rf-saved-part-name{color:var(--c-text);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rf-saved-top{display:flex;align-items:center;justify-content:space-between;}
.rf-saved-uc{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--c-accent);font-family:'JetBrains Mono';letter-spacing:0.5px;}
.rf-saved-name{font-family:'Chakra Petch';font-weight:600;font-size:18px;margin:10px 0 14px;}
.rf-saved-scores{display:flex;align-items:center;gap:18px;}
.rf-mini-score{display:flex;flex-direction:column;}
.rf-mini-num{font-family:'JetBrains Mono';font-weight:700;font-size:22px;line-height:1;}
.rf-mini-lbl{font-size:10px;color:var(--c-muted);letter-spacing:1px;margin-top:2px;}
.rf-saved-price{margin-left:auto;font-family:'JetBrains Mono';font-weight:700;font-size:16px;}
.rf-incompat{display:flex;align-items:center;gap:6px;color:var(--c-bad);font-size:12px;margin-top:12px;}

/* STEPS */
.rf-step{max-width:760px;margin:0 auto;}
.rf-step-head{text-align:center;padding:26px 0 30px;}
.rf-step-head p{margin:10px auto 0;max-width:480px;font-size:14.5px;}
.rf-step-head .rf-eyebrow{justify-content:center;display:flex;}
.rf-uc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;}
.rf-uc-card{position:relative;text-align:left;background:var(--c-panel);border:1px solid var(--c-border);border-radius:16px;
padding:22px;cursor:pointer;transition:transform .2s,border-color .2s,background .2s;color:var(--c-text);overflow:hidden;}
.rf-uc-card:hover{transform:translateY(-4px);border-color:rgba(46,230,207,0.45);background:var(--c-panel-2);}
.rf-uc-icon{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;color:var(--c-accent);
background:rgba(46,230,207,0.1);border:1px solid rgba(46,230,207,0.2);margin-bottom:14px;}
.rf-uc-label{font-family:'Chakra Petch';font-weight:600;font-size:17px;}
.rf-uc-tag{color:var(--c-muted);font-size:13px;margin-top:3px;}
.rf-uc-go{position:absolute;top:22px;right:20px;color:var(--c-muted);transition:.2s;}
.rf-uc-card:hover .rf-uc-go{color:var(--c-accent);transform:translateX(3px);}

/* BUDGET */
.rf-budget-display{font-family:'JetBrains Mono';font-weight:700;font-size:58px;text-align:center;
color:var(--c-accent);text-shadow:0 0 30px rgba(46,230,207,0.4);letter-spacing:-1px;}
.rf-slider-wrap{max-width:560px;margin:22px auto 0;}
.rf-slider{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:6px;outline:none;cursor:pointer;}
.rf-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;
background:var(--c-accent);border:3px solid #04110f;box-shadow:0 0 16px rgba(46,230,207,0.8);cursor:grab;transition:transform .15s;}
.rf-slider::-webkit-slider-thumb:hover{transform:scale(1.15);}
.rf-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--c-accent);border:3px solid #04110f;box-shadow:0 0 16px rgba(46,230,207,0.8);cursor:grab;}
.rf-slider-ends{display:flex;justify-content:space-between;margin-top:9px;font-size:12px;color:var(--c-muted);font-family:'JetBrains Mono';}
.rf-presets{display:flex;gap:9px;justify-content:center;margin:22px 0;flex-wrap:wrap;}
.rf-preset{background:var(--c-panel);border:1px solid var(--c-border);color:var(--c-text);font-family:'JetBrains Mono';
font-size:13px;padding:8px 16px;border-radius:9px;cursor:pointer;transition:.16s;}
.rf-preset:hover{border-color:rgba(46,230,207,0.4);}
.rf-preset.active{background:rgba(46,230,207,0.15);border-color:var(--c-accent);color:var(--c-accent);}

.rf-alloc{max-width:560px;margin:24px auto 0;background:var(--c-panel);border:1px solid var(--c-border);border-radius:15px;padding:18px 20px;}
.rf-alloc-title{font-family:'Chakra Petch';font-size:14px;margin-bottom:14px;color:var(--c-muted);}
.rf-alloc-row{display:grid;grid-template-columns:96px 1fr 60px;align-items:center;gap:12px;margin-bottom:9px;}
.rf-alloc-lbl{font-size:12.5px;color:var(--c-muted);}
.rf-alloc-track{height:7px;background:var(--c-track);border-radius:5px;overflow:hidden;}
.rf-alloc-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--c-accent),var(--c-accent2));transition:width .6s cubic-bezier(.2,.8,.2,1);}
.rf-alloc-val{font-family:'JetBrains Mono';font-size:12.5px;text-align:right;}
.rf-step-actions{display:flex;justify-content:space-between;align-items:center;max-width:560px;margin:30px auto 0;}

/* RESULTS */
.rf-results-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:18px 0 18px;flex-wrap:wrap;}
.rf-results-actions{display:flex;gap:10px;}
.rf-scorecard{display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;
background:var(--c-panel);border:1px solid var(--c-border);border-radius:18px;padding:24px;margin-bottom:14px;}
.rf-gauges{display:flex;gap:14px;}
.rf-gauge{position:relative;display:grid;place-items:center;}
.rf-gauge svg{transform:rotate(0);}
.rf-gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.rf-gauge-num{font-family:'JetBrains Mono';font-weight:700;font-size:34px;line-height:1;}
.rf-gauge-label{font-size:9.5px;letter-spacing:1.5px;color:var(--c-muted);margin-top:3px;}
.rf-verdict-tag{display:inline-flex;align-items:center;gap:7px;font-family:'JetBrains Mono';font-size:11px;letter-spacing:1px;color:var(--c-accent2);margin-bottom:9px;}
.rf-hybrid{font-size:9px;background:rgba(124,92,255,0.16);border:1px solid rgba(124,92,255,0.3);color:var(--c-accent2);padding:1px 6px;border-radius:20px;letter-spacing:1px;}
.rf-verdict p{margin:0 0 16px;font-size:14.5px;line-height:1.6;color:var(--c-text);}
.rf-total-row{display:flex;align-items:center;gap:12px;font-size:13px;}
.rf-total{font-family:'JetBrains Mono';font-weight:700;font-size:18px;}
.rf-total.over{color:var(--c-bad);}
.rf-budget-bar{flex:1;height:7px;background:var(--c-track);border-radius:5px;overflow:hidden;min-width:80px;}
.rf-budget-fill{height:100%;border-radius:5px;transition:width .8s cubic-bezier(.2,.8,.2,1);}

.rf-compat{display:flex;gap:12px;align-items:flex-start;border-radius:14px;padding:15px 18px;margin-bottom:18px;font-size:14px;}
.rf-compat.ok{background:rgba(70,224,160,0.08);border:1px solid rgba(70,224,160,0.28);color:var(--c-good);}
.rf-compat.bad{background:rgba(255,92,114,0.08);border:1px solid rgba(255,92,114,0.3);color:var(--c-bad);}
.rf-compat ul{margin:8px 0 0;padding-left:18px;color:var(--c-bad);font-size:13px;line-height:1.7;}
.rf-compat strong{font-family:'Chakra Petch';font-weight:600;}

.rf-parts{display:flex;flex-direction:column;gap:10px;}
.rf-part{background:var(--c-panel);border:1px solid var(--c-border);border-radius:14px;overflow:hidden;transition:border-color .2s;}
.rf-part:hover{border-color:var(--c-hover);}
.rf-part-top{display:flex;align-items:center;gap:14px;padding:14px 16px 0;}
.rf-part-actions{display:flex;gap:8px;justify-content:flex-end;padding:11px 16px 14px;}
.rf-part-icon{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;color:var(--c-accent);background:rgba(46,230,207,0.08);border:1px solid rgba(46,230,207,0.16);flex-shrink:0;}
.rf-part-info{flex:1;min-width:0;}
.rf-part-cat{font-size:11px;letter-spacing:1px;color:var(--c-muted);text-transform:uppercase;font-family:'JetBrains Mono';}
.rf-part-name{font-family:'Chakra Petch';font-weight:600;font-size:16px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rf-part-price-col{text-align:right;flex-shrink:0;}
.rf-part-price{font-family:'JetBrains Mono';font-weight:700;font-size:16px;}
.rf-part-price.within{color:var(--c-text);}
.rf-part-price.tight{color:var(--c-warn);}
.rf-part-price.over{color:var(--c-bad);}
.rf-flag{font-size:9px;font-family:'JetBrains Mono';letter-spacing:1px;margin-top:3px;padding:1px 5px;border-radius:4px;display:inline-block;}
.rf-flag.over{color:var(--c-bad);background:rgba(255,92,114,0.14);border:1px solid rgba(255,92,114,0.35);}
.rf-flag.tight{color:var(--c-warn);background:rgba(255,194,75,0.12);}
.rf-part-score{width:40px;height:40px;border-radius:11px;border:2px solid;display:grid;place-items:center;font-family:'JetBrains Mono';font-weight:700;font-size:16px;flex-shrink:0;}
.rf-part-btns{display:flex;gap:7px;flex-shrink:0;}
.rf-chip-btn{display:inline-flex;align-items:center;gap:5px;background:var(--c-panel-2);border:1px solid var(--c-border);color:var(--c-text);
font-family:'Sora';font-size:12.5px;padding:7px 12px;border-radius:9px;cursor:pointer;transition:.16s;}
.rf-chip-btn:hover{border-color:var(--c-hover);}
.rf-chip-btn.primary{color:var(--c-accent);border-color:rgba(46,230,207,0.3);}
.rf-chip-btn.primary:hover{background:rgba(46,230,207,0.1);}

.rf-info{padding:14px 16px 16px 72px;border-top:1px solid var(--c-border);}
.rf-info-specs{margin-bottom:16px;}
.rf-pc-head{display:inline-flex;align-items:center;gap:7px;font-family:'JetBrains Mono';font-size:10px;letter-spacing:2px;color:var(--c-accent2);margin-bottom:11px;}
.rf-pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.rf-pc-h{font-family:'JetBrains Mono';font-size:10px;letter-spacing:2px;margin-bottom:9px;}
.rf-pc-h.pros{color:var(--c-good);}
.rf-pc-h.cons{color:var(--c-bad);}
.rf-pc-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.rf-pc{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.45;color:var(--c-text);}
.rf-pc svg{flex-shrink:0;margin-top:2px;}
.rf-pc.pro svg{color:var(--c-good);}
.rf-pc.con svg{color:var(--c-bad);}
.rf-pc.con.strong{color:var(--c-bad);font-weight:600;}
.rf-info-h{font-family:'JetBrains Mono';font-size:10px;letter-spacing:2px;color:var(--c-muted);margin-bottom:9px;}
.rf-info-facts{display:flex;flex-wrap:wrap;gap:6px;}
.rf-fact{font-size:12px;background:var(--c-panel-2);border:1px solid var(--c-border);padding:4px 9px;border-radius:7px;color:var(--c-text);font-family:'JetBrains Mono';}
.rf-foryou{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;}
.rf-fy{display:flex;gap:7px;align-items:flex-start;font-size:12.5px;line-height:1.45;}
.rf-fy svg{flex-shrink:0;margin-top:2px;}
.rf-fy.good{color:var(--c-good);}
.rf-fy.bad{color:var(--c-bad);}
.rf-fy.warn{color:var(--c-warn);}

/* DRAWER */
.rf-drawer-wrap{position:fixed;inset:0;z-index:40;background:rgba(2,4,8,0.66);backdrop-filter:blur(4px);display:flex;justify-content:flex-end;animation:rfFade .2s ease;}
.rf-drawer{width:min(460px,100%);height:100%;background:#0b0f16;border-left:1px solid var(--c-border);
display:flex;flex-direction:column;animation:rfSlideR .28s cubic-bezier(.2,.8,.2,1);}
.rf-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;padding:20px;border-bottom:1px solid var(--c-border);}
.rf-drawer-list{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;}
.rf-pick{display:flex;flex-direction:column;background:var(--c-panel);border:1px solid var(--c-border);
border-radius:12px;padding:12px;color:var(--c-text);transition:border-color .16s,background .16s;}
.rf-pick:hover{border-color:rgba(46,230,207,0.3);}
.rf-pick.current{border-color:rgba(46,230,207,0.5);background:rgba(46,230,207,0.06);}
.rf-pick-row{display:flex;align-items:center;gap:13px;}
.rf-pick-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:11px;}
.rf-clickable{cursor:pointer;}
.rf-variant-count{font-size:9px;background:rgba(124,92,255,0.16);border:1px solid rgba(124,92,255,0.3);color:var(--c-accent2);
padding:1px 7px;border-radius:20px;font-family:'JetBrains Mono';letter-spacing:0.5px;margin-left:8px;vertical-align:middle;}
.rf-variants{margin-top:11px;padding-top:11px;border-top:1px dashed var(--c-border);display:flex;flex-direction:column;gap:9px;}
.rf-variant{background:var(--c-panel);border:1px solid var(--c-border);border-radius:10px;padding:10px;}
.rf-variant.current{border-color:rgba(46,230,207,0.5);background:rgba(46,230,207,0.06);}
.rf-variant-row{display:flex;align-items:center;gap:11px;}
.rf-pick-score.sm{width:32px;height:32px;border-radius:9px;font-size:13px;}
.rf-variant-name{flex:1;font-family:'Chakra Petch';font-weight:600;font-size:13.5px;min-width:0;}
.rf-variant-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.rf-info.compact{padding:12px 2px 2px;}
.rf-info.compact .rf-info-specs{margin-bottom:12px;}
.rf-info.compact .rf-pc-grid{grid-template-columns:1fr;gap:14px;}
.rf-pick-score{width:38px;height:38px;border-radius:10px;border:2px solid;display:grid;place-items:center;font-family:'JetBrains Mono';font-weight:700;font-size:15px;flex-shrink:0;}
.rf-pick-info{flex:1;min-width:0;}
.rf-pick-name{font-family:'Chakra Petch';font-weight:600;font-size:14.5px;}
.rf-cur-tag{font-size:9px;background:rgba(46,230,207,0.15);color:var(--c-accent);padding:1px 6px;border-radius:10px;font-family:'JetBrains Mono';margin-left:6px;}
.rf-pick-facts{font-size:11.5px;color:var(--c-muted);font-family:'JetBrains Mono';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rf-pick-warn{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--c-warn);margin-top:4px;}
.rf-pick-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.rf-compat-ok{color:var(--c-good);}
.rf-compat-bad{color:var(--c-bad);}

/* MODAL */
.rf-modal-wrap{position:fixed;inset:0;z-index:50;background:rgba(2,4,8,0.7);backdrop-filter:blur(4px);display:grid;place-items:center;animation:rfFade .2s ease;padding:20px;}
.rf-modal{width:min(420px,100%);background:#0c1119;border:1px solid var(--c-border);border-radius:18px;padding:26px;animation:rfPop .26s cubic-bezier(.2,.9,.3,1.2);}
.rf-input{width:100%;background:var(--c-panel);border:1px solid var(--c-border);color:var(--c-text);font-family:'Sora';
font-size:15px;padding:12px 14px;border-radius:11px;margin:14px 0 18px;outline:none;transition:.16s;}
.rf-input:focus{border-color:var(--c-accent);box-shadow:0 0 0 3px rgba(46,230,207,0.12);}
.rf-modal-actions{display:flex;justify-content:flex-end;gap:10px;}

/* TOAST */
.rf-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:8px;
background:#0d1620;border:1px solid rgba(70,224,160,0.4);color:var(--c-good);padding:12px 20px;border-radius:12px;
font-size:14px;box-shadow:0 10px 40px rgba(0,0,0,0.5);animation:rfToast .3s cubic-bezier(.2,.9,.3,1.2);}

/* ANIMATIONS */
@keyframes rfFade{from{opacity:0}to{opacity:1}}
@keyframes rfUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes rfPop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rfSlideR{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes rfSlideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:300px}}
@keyframes rfToast{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.rf-fade{animation:rfFade .35s ease;}
.rf-pop{animation:rfUp .5s cubic-bezier(.2,.8,.2,1) backwards;}
.rf-slidein{animation:rfSlideDown .3s ease;}

/* FORGE MODE BUTTONS */
.rf-forge-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:24px auto 0;}
.rf-forge-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;border-radius:10px;
padding:9px 16px;font-family:'Chakra Petch';font-weight:700;font-size:13px;letter-spacing:.3px;
transition:transform .16s,box-shadow .16s,filter .16s,background .16s,border-color .16s;}
.rf-forge-btn:active{transform:translateY(-1px) scale(.99);}
.rf-forge-btn.primary{border:none;background:linear-gradient(135deg,var(--c-accent),#19b89f);color:#04110f;
box-shadow:0 5px 16px rgba(46,230,207,0.26);}
.rf-forge-btn.primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(46,230,207,0.4);filter:brightness(1.05);}
.rf-forge-btn.outline{background:var(--c-panel);border:1.5px solid rgba(124,92,255,0.45);color:var(--c-text);}
.rf-forge-btn.outline svg{color:var(--c-accent2);}
.rf-forge-btn.outline:hover{transform:translateY(-2px);border-color:var(--c-accent2);background:var(--c-panel-2);box-shadow:0 8px 24px rgba(124,92,255,0.2);}
.rf-step-actions.center{justify-content:center;}
.rf-compat.warn{background:rgba(255,194,75,0.08);border:1px solid rgba(255,194,75,0.3);color:var(--c-warn);}
.rf-compat-sub{display:block;margin-top:5px;font-size:12.5px;color:var(--c-warn);}

/* AI ASSISTANT */
.rf-fab{position:fixed;bottom:22px;right:22px;z-index:44;display:inline-flex;align-items:center;gap:8px;
border:none;cursor:pointer;background:linear-gradient(135deg,var(--c-accent2),#5b3fd6);color:#fff;
font-family:'Chakra Petch';font-weight:700;font-size:14px;padding:12px 18px;border-radius:30px;
box-shadow:0 8px 28px rgba(124,92,255,0.45);transition:transform .18s,box-shadow .18s;}
.rf-fab:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(124,92,255,0.6);}
.rf-assistant{position:fixed;top:0;right:0;height:100vh;width:min(390px,100%);z-index:46;
background:#0b0f16;border-left:1px solid var(--c-border);display:flex;flex-direction:column;
box-shadow:-12px 0 40px rgba(0,0,0,0.5);animation:rfSlideR .28s cubic-bezier(.2,.8,.2,1);}
.rf-asst-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--c-border);}
.rf-asst-title{display:flex;align-items:center;gap:10px;font-family:'Chakra Petch';font-weight:600;font-size:16px;}
.rf-asst-avatar{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#fff;
background:linear-gradient(135deg,var(--c-accent2),#5b3fd6);flex-shrink:0;}
.rf-asst-avatar.sm{width:24px;height:24px;border-radius:7px;}
.rf-asst-avatar.big{width:46px;height:46px;border-radius:13px;margin:0 auto 6px;}
.rf-asst-list{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;}
.rf-asst-welcome{text-align:center;color:var(--c-muted);margin:auto 0;}
.rf-asst-welcome p{font-size:13.5px;line-height:1.5;margin:0 0 16px;}
.rf-asst-suggest{display:flex;flex-direction:column;gap:8px;}
.rf-asst-chip{background:var(--c-panel);border:1px solid var(--c-border);color:var(--c-text);
font-family:'Sora';font-size:13px;padding:10px 14px;border-radius:10px;cursor:pointer;text-align:left;transition:.16s;}
.rf-asst-chip:hover{border-color:var(--c-accent2);background:var(--c-panel-2);}
.rf-msg{display:flex;gap:9px;align-items:flex-start;}
.rf-msg.user{justify-content:flex-end;}
.rf-bubble{max-width:80%;padding:11px 14px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;}
.rf-msg.user .rf-bubble{background:linear-gradient(135deg,var(--c-accent2),#5b3fd6);color:#fff;border-bottom-right-radius:4px;}
.rf-msg.assistant .rf-bubble{background:var(--c-panel-2);border:1px solid var(--c-border);color:var(--c-text);border-bottom-left-radius:4px;}
.rf-typing{display:flex;gap:4px;align-items:center;}
.rf-typing span{width:6px;height:6px;border-radius:50%;background:var(--c-muted);animation:rfBlink 1.2s infinite;}
.rf-typing span:nth-child(2){animation-delay:.2s;}
.rf-typing span:nth-child(3){animation-delay:.4s;}
.rf-asst-error{color:var(--c-bad);font-size:13px;text-align:center;}
.rf-asst-input{display:flex;gap:9px;padding:14px;border-top:1px solid var(--c-border);}
.rf-asst-input input{flex:1;background:var(--c-panel);border:1px solid var(--c-border);color:var(--c-text);
font-family:'Sora';font-size:14px;padding:11px 14px;border-radius:11px;outline:none;transition:.16s;}
.rf-asst-input input:focus{border-color:var(--c-accent2);box-shadow:0 0 0 3px rgba(124,92,255,0.12);}
.rf-asst-send{border:none;cursor:pointer;background:linear-gradient(135deg,var(--c-accent2),#5b3fd6);color:#fff;
width:44px;border-radius:11px;display:grid;place-items:center;transition:.16s;}
.rf-asst-send:disabled{opacity:0.4;cursor:default;}
@keyframes rfBlink{0%,60%,100%{opacity:0.25}30%{opacity:1}}
.rf-cursor{display:inline-block;width:7px;height:14px;margin-left:2px;border-radius:1px;
background:var(--c-accent2);vertical-align:text-bottom;animation:rfCursor 1s steps(2,start) infinite;}
@keyframes rfCursor{0%,100%{opacity:1}50%{opacity:0}}

@media(max-width:680px){
.rf-fab{bottom:16px;right:16px;}
.rf-scorecard{grid-template-columns:1fr;}
.rf-gauges{justify-content:center;}
.rf-info{padding-left:16px;}
.rf-pc-grid{grid-template-columns:1fr;gap:16px;}
.rf-part-actions .rf-chip-btn{flex:1;justify-content:center;}
.rf-part-name{font-size:14px;}
}
`}</style>
  );
}
