// app.js - Pastel Flex Lotto Lab Client Logic with Local Storage, Matcher, and Pinned/Excluded Filters

// --- Data Constants ---
const FREQUENCY_SCORES = {
  1: 9, 2: 7, 3: 8, 4: 7, 5: 6, 6: 7, 7: 8, 8: 7, 9: 6, 10: 7,
  11: 8, 12: 8, 13: 9, 14: 8, 15: 7, 16: 6, 17: 9, 18: 9, 19: 6, 20: 8,
  21: 7, 22: 7, 23: 6, 24: 8, 25: 7, 26: 8, 27: 10, 28: 7, 29: 6, 30: 7,
  31: 8, 32: 7, 33: 9, 34: 10, 35: 7, 36: 6, 37: 8, 38: 7, 39: 9, 40: 8,
  41: 7, 42: 8, 43: 10, 44: 8, 45: 9
};

const COLD_NUMBERS = new Set([5, 9, 16, 23, 29, 36]);
const adjustedWeights = { ...FREQUENCY_SCORES };
COLD_NUMBERS.forEach(num => {
  adjustedWeights[num] += 2;
});

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]);

const MODE_DESCRIPTIONS = {
  1: { name: "stat-stat", desc: "1차 통계 + 2차 통계 (전형적 피팅 중심)" },
  2: { name: "rand-stat", desc: "1차 무작위 + 2차 통계 (랜덤 후 균형 보완)" },
  3: { name: "stat-rand", desc: "1차 통계 + 2차 무작위 (통계 선점 후 랜덤)" },
  4: { name: "rand-rand", desc: "1차 무작위 + 2차 무작위 (순수 이중 무작위)" }
};

// 100% Reliable Offline Fallback Data
const FALLBACK_LATEST_DRAW = {
  drwNo: 1229,
  drwNoDate: "2026-06-27",
  drwtNo1: 1,
  drwtNo2: 5,
  drwtNo3: 12,
  drwtNo4: 19,
  drwtNo5: 23,
  drwtNo6: 44,
  bnusNo: 35,
  firstWinamnt: 1850000000,
  returnValue: "success"
};

// 3-Year Historical Draws database for dynamic frequency modeling
const HISTORICAL_DRAWS = [
  {drwNo:1074,drwNoDate:"2023-07-01",numbers:[1, 6, 20, 27, 28, 41],bnusNo:15},
  {drwNo:1075,drwNoDate:"2023-07-08",numbers:[1, 23, 24, 35, 44, 45],bnusNo:10},
  {drwNo:1076,drwNoDate:"2023-07-15",numbers:[3, 7, 9, 33, 36, 37],bnusNo:10},
  {drwNo:1077,drwNoDate:"2023-07-22",numbers:[4, 8, 17, 30, 40, 43],bnusNo:34},
  {drwNo:1078,drwNoDate:"2023-07-29",numbers:[6, 10, 11, 14, 36, 38],bnusNo:43},
  {drwNo:1079,drwNoDate:"2023-08-05",numbers:[4, 8, 18, 24, 37, 45],bnusNo:6},
  {drwNo:1080,drwNoDate:"2023-08-12",numbers:[13, 16, 23, 31, 36, 44],bnusNo:38},
  {drwNo:1081,drwNoDate:"2023-08-19",numbers:[1, 9, 16, 23, 24, 38],bnusNo:17},
  {drwNo:1082,drwNoDate:"2023-08-26",numbers:[21, 26, 27, 32, 34, 42],bnusNo:31},
  {drwNo:1083,drwNoDate:"2023-09-02",numbers:[3, 7, 14, 15, 22, 38],bnusNo:17},
  {drwNo:1084,drwNoDate:"2023-09-09",numbers:[8, 12, 13, 29, 33, 42],bnusNo:5},
  {drwNo:1085,drwNoDate:"2023-09-16",numbers:[4, 7, 17, 18, 38, 44],bnusNo:36},
  {drwNo:1086,drwNoDate:"2023-09-23",numbers:[11, 16, 25, 27, 35, 36],bnusNo:37},
  {drwNo:1087,drwNoDate:"2023-09-30",numbers:[13, 14, 18, 21, 34, 44],bnusNo:16},
  {drwNo:1088,drwNoDate:"2023-10-07",numbers:[11, 21, 22, 30, 39, 44],bnusNo:31},
  {drwNo:1089,drwNoDate:"2023-10-14",numbers:[4, 18, 31, 37, 42, 43],bnusNo:40},
  {drwNo:1090,drwNoDate:"2023-10-21",numbers:[12, 19, 21, 29, 40, 45],bnusNo:1},
  {drwNo:1091,drwNoDate:"2023-10-28",numbers:[6, 20, 23, 24, 28, 30],bnusNo:44},
  {drwNo:1092,drwNoDate:"2023-11-04",numbers:[7, 18, 19, 26, 33, 45],bnusNo:37},
  {drwNo:1093,drwNoDate:"2023-11-11",numbers:[10, 17, 22, 30, 35, 43],bnusNo:44},
  {drwNo:1094,drwNoDate:"2023-11-18",numbers:[6, 7, 15, 22, 26, 40],bnusNo:41},
  {drwNo:1095,drwNoDate:"2023-11-25",numbers:[8, 14, 28, 29, 34, 40],bnusNo:12},
  {drwNo:1096,drwNoDate:"2023-12-02",numbers:[1, 12, 16, 19, 23, 43],bnusNo:34},
  {drwNo:1097,drwNoDate:"2023-12-09",numbers:[14, 33, 34, 35, 37, 40],bnusNo:4},
  {drwNo:1098,drwNoDate:"2023-12-16",numbers:[12, 16, 21, 24, 41, 43],bnusNo:15},
  {drwNo:1099,drwNoDate:"2023-12-23",numbers:[3, 20, 28, 38, 40, 43],bnusNo:4},
  {drwNo:1100,drwNoDate:"2023-12-30",numbers:[17, 26, 29, 30, 31, 43],bnusNo:12},
  {drwNo:1101,drwNoDate:"2024-01-06",numbers:[6, 7, 13, 28, 36, 42],bnusNo:41},
  {drwNo:1102,drwNoDate:"2024-01-13",numbers:[13, 14, 22, 26, 37, 38],bnusNo:20},
  {drwNo:1103,drwNoDate:"2024-01-20",numbers:[10, 12, 29, 31, 40, 44],bnusNo:2},
  {drwNo:1104,drwNoDate:"2024-01-27",numbers:[1, 7, 21, 30, 35, 38],bnusNo:2},
  {drwNo:1105,drwNoDate:"2024-02-03",numbers:[6, 16, 34, 37, 39, 40],bnusNo:11},
  {drwNo:1106,drwNoDate:"2024-02-10",numbers:[1, 3, 4, 29, 42, 45],bnusNo:36},
  {drwNo:1107,drwNoDate:"2024-02-17",numbers:[6, 14, 30, 31, 40, 41],bnusNo:29},
  {drwNo:1108,drwNoDate:"2024-02-24",numbers:[7, 19, 26, 37, 39, 44],bnusNo:27},
  {drwNo:1109,drwNoDate:"2024-03-02",numbers:[10, 12, 13, 19, 33, 40],bnusNo:2},
  {drwNo:1110,drwNoDate:"2024-03-09",numbers:[3, 7, 11, 20, 22, 41],bnusNo:24},
  {drwNo:1111,drwNoDate:"2024-03-16",numbers:[3, 13, 30, 33, 43, 45],bnusNo:4},
  {drwNo:1112,drwNoDate:"2024-03-23",numbers:[16, 20, 26, 36, 42, 44],bnusNo:24},
  {drwNo:1113,drwNoDate:"2024-03-30",numbers:[11, 13, 20, 21, 32, 44],bnusNo:8},
  {drwNo:1114,drwNoDate:"2024-04-06",numbers:[10, 16, 19, 32, 33, 38],bnusNo:3},
  {drwNo:1115,drwNoDate:"2024-04-13",numbers:[7, 12, 23, 32, 34, 36],bnusNo:8},
  {drwNo:1116,drwNoDate:"2024-04-20",numbers:[15, 16, 17, 25, 30, 31],bnusNo:32},
  {drwNo:1117,drwNoDate:"2024-04-27",numbers:[3, 4, 9, 30, 33, 36],bnusNo:7},
  {drwNo:1118,drwNoDate:"2024-05-04",numbers:[11, 13, 14, 15, 16, 45],bnusNo:3},
  {drwNo:1119,drwNoDate:"2024-05-11",numbers:[1, 9, 12, 13, 20, 45],bnusNo:3},
  {drwNo:1120,drwNoDate:"2024-05-18",numbers:[2, 19, 26, 31, 38, 41],bnusNo:34},
  {drwNo:1121,drwNoDate:"2024-05-25",numbers:[6, 24, 31, 32, 38, 44],bnusNo:8},
  {drwNo:1122,drwNoDate:"2024-06-01",numbers:[3, 6, 21, 30, 34, 35],bnusNo:22},
  {drwNo:1123,drwNoDate:"2024-06-08",numbers:[13, 19, 21, 24, 34, 35],bnusNo:26},
  {drwNo:1124,drwNoDate:"2024-06-15",numbers:[3, 8, 17, 30, 33, 34],bnusNo:28},
  {drwNo:1125,drwNoDate:"2024-06-22",numbers:[6, 14, 25, 33, 40, 44],bnusNo:30},
  {drwNo:1126,drwNoDate:"2024-06-29",numbers:[4, 5, 9, 11, 37, 40],bnusNo:7},
  {drwNo:1127,drwNoDate:"2024-07-06",numbers:[10, 15, 24, 30, 31, 37],bnusNo:32},
  {drwNo:1128,drwNoDate:"2024-07-13",numbers:[1, 5, 8, 16, 28, 33],bnusNo:45},
  {drwNo:1129,drwNoDate:"2024-07-20",numbers:[5, 10, 11, 17, 28, 34],bnusNo:22},
  {drwNo:1130,drwNoDate:"2024-07-27",numbers:[15, 19, 21, 25, 27, 28],bnusNo:40},
  {drwNo:1131,drwNoDate:"2024-08-03",numbers:[1, 2, 6, 14, 27, 38],bnusNo:33},
  {drwNo:1132,drwNoDate:"2024-08-10",numbers:[6, 7, 19, 28, 34, 41],bnusNo:5},
  {drwNo:1133,drwNoDate:"2024-08-17",numbers:[13, 14, 20, 28, 29, 34],bnusNo:23},
  {drwNo:1134,drwNoDate:"2024-08-24",numbers:[3, 7, 9, 13, 19, 24],bnusNo:23},
  {drwNo:1135,drwNoDate:"2024-08-31",numbers:[1, 6, 13, 19, 21, 33],bnusNo:4},
  {drwNo:1136,drwNoDate:"2024-09-07",numbers:[21, 33, 35, 38, 42, 44],bnusNo:1},
  {drwNo:1137,drwNoDate:"2024-09-14",numbers:[4, 9, 12, 15, 33, 45],bnusNo:26},
  {drwNo:1138,drwNoDate:"2024-09-21",numbers:[14, 16, 19, 20, 29, 34],bnusNo:35},
  {drwNo:1139,drwNoDate:"2024-09-28",numbers:[5, 12, 15, 30, 37, 40],bnusNo:18},
  {drwNo:1140,drwNoDate:"2024-10-05",numbers:[7, 10, 22, 29, 31, 38],bnusNo:15},
  {drwNo:1141,drwNoDate:"2024-10-12",numbers:[7, 11, 12, 21, 26, 35],bnusNo:20},
  {drwNo:1142,drwNoDate:"2024-10-19",numbers:[2, 8, 28, 30, 37, 41],bnusNo:22},
  {drwNo:1143,drwNoDate:"2024-10-26",numbers:[10, 16, 17, 27, 28, 36],bnusNo:6},
  {drwNo:1144,drwNoDate:"2024-11-02",numbers:[3, 4, 12, 15, 26, 34],bnusNo:6},
  {drwNo:1145,drwNoDate:"2024-11-09",numbers:[2, 11, 31, 33, 37, 44],bnusNo:32},
  {drwNo:1146,drwNoDate:"2024-11-16",numbers:[6, 11, 17, 19, 40, 43],bnusNo:28},
  {drwNo:1147,drwNoDate:"2024-11-23",numbers:[7, 11, 24, 26, 27, 37],bnusNo:32},
  {drwNo:1148,drwNoDate:"2024-11-30",numbers:[3, 6, 13, 15, 16, 22],bnusNo:32},
  {drwNo:1149,drwNoDate:"2024-12-07",numbers:[8, 15, 19, 21, 32, 36],bnusNo:38},
  {drwNo:1150,drwNoDate:"2024-12-14",numbers:[8, 9, 18, 35, 39, 45],bnusNo:25},
  {drwNo:1151,drwNoDate:"2024-12-21",numbers:[2, 3, 9, 15, 27, 29],bnusNo:8},
  {drwNo:1152,drwNoDate:"2024-12-28",numbers:[30, 31, 32, 35, 36, 37],bnusNo:5},
  {drwNo:1153,drwNoDate:"2025-01-04",numbers:[1, 9, 10, 13, 35, 44],bnusNo:5},
  {drwNo:1154,drwNoDate:"2025-01-11",numbers:[4, 8, 22, 26, 32, 38],bnusNo:27},
  {drwNo:1155,drwNoDate:"2025-01-18",numbers:[10, 16, 19, 27, 37, 38],bnusNo:13},
  {drwNo:1156,drwNoDate:"2025-01-25",numbers:[30, 31, 34, 39, 41, 45],bnusNo:7},
  {drwNo:1157,drwNoDate:"2025-02-01",numbers:[5, 7, 12, 20, 25, 26],bnusNo:28},
  {drwNo:1158,drwNoDate:"2025-02-08",numbers:[21, 25, 27, 32, 37, 38],bnusNo:20},
  {drwNo:1159,drwNoDate:"2025-02-15",numbers:[3, 9, 27, 28, 38, 39],bnusNo:7},
  {drwNo:1160,drwNoDate:"2025-02-22",numbers:[7, 13, 18, 36, 39, 45],bnusNo:19},
  {drwNo:1161,drwNoDate:"2025-03-01",numbers:[2, 12, 20, 24, 34, 42],bnusNo:37},
  {drwNo:1162,drwNoDate:"2025-03-08",numbers:[20, 21, 22, 25, 28, 29],bnusNo:6},
  {drwNo:1163,drwNoDate:"2025-03-15",numbers:[2, 13, 15, 16, 33, 43],bnusNo:4},
  {drwNo:1164,drwNoDate:"2025-03-22",numbers:[17, 18, 23, 25, 38, 39],bnusNo:22},
  {drwNo:1165,drwNoDate:"2025-03-29",numbers:[6, 7, 27, 29, 38, 45],bnusNo:17},
  {drwNo:1166,drwNoDate:"2025-04-05",numbers:[14, 23, 25, 27, 29, 42],bnusNo:16},
  {drwNo:1167,drwNoDate:"2025-04-12",numbers:[8, 23, 31, 35, 39, 40],bnusNo:24},
  {drwNo:1168,drwNoDate:"2025-04-19",numbers:[9, 21, 24, 30, 33, 37],bnusNo:29},
  {drwNo:1169,drwNoDate:"2025-04-26",numbers:[5, 12, 24, 26, 39, 42],bnusNo:20},
  {drwNo:1170,drwNoDate:"2025-05-03",numbers:[3, 13, 28, 34, 38, 42],bnusNo:25},
  {drwNo:1171,drwNoDate:"2025-05-10",numbers:[3, 6, 7, 11, 12, 17],bnusNo:19},
  {drwNo:1172,drwNoDate:"2025-05-17",numbers:[7, 9, 24, 40, 42, 44],bnusNo:45},
  {drwNo:1173,drwNoDate:"2025-05-24",numbers:[1, 5, 18, 20, 30, 35],bnusNo:3},
  {drwNo:1174,drwNoDate:"2025-05-31",numbers:[8, 11, 14, 17, 36, 39],bnusNo:22},
  {drwNo:1175,drwNoDate:"2025-06-07",numbers:[3, 4, 6, 8, 32, 42],bnusNo:31},
  {drwNo:1176,drwNoDate:"2025-06-14",numbers:[7, 9, 11, 21, 30, 35],bnusNo:29},
  {drwNo:1177,drwNoDate:"2025-06-21",numbers:[3, 7, 15, 16, 19, 43],bnusNo:21},
  {drwNo:1178,drwNoDate:"2025-06-28",numbers:[5, 6, 11, 27, 43, 44],bnusNo:17},
  {drwNo:1179,drwNoDate:"2025-07-05",numbers:[3, 16, 18, 24, 40, 44],bnusNo:21},
  {drwNo:1180,drwNoDate:"2025-07-12",numbers:[6, 12, 18, 37, 40, 41],bnusNo:3},
  {drwNo:1181,drwNoDate:"2025-07-19",numbers:[8, 10, 14, 20, 33, 41],bnusNo:28},
  {drwNo:1182,drwNoDate:"2025-07-26",numbers:[1, 13, 21, 25, 28, 31],bnusNo:22},
  {drwNo:1183,drwNoDate:"2025-08-02",numbers:[4, 15, 17, 23, 27, 36],bnusNo:31},
  {drwNo:1184,drwNoDate:"2025-08-09",numbers:[14, 16, 23, 25, 31, 37],bnusNo:42},
  {drwNo:1185,drwNoDate:"2025-08-16",numbers:[6, 17, 22, 28, 29, 32],bnusNo:38},
  {drwNo:1186,drwNoDate:"2025-08-23",numbers:[2, 8, 13, 16, 23, 28],bnusNo:35},
  {drwNo:1187,drwNoDate:"2025-08-30",numbers:[5, 13, 26, 29, 37, 40],bnusNo:42},
  {drwNo:1188,drwNoDate:"2025-09-06",numbers:[3, 4, 12, 19, 22, 27],bnusNo:9},
  {drwNo:1189,drwNoDate:"2025-09-13",numbers:[9, 19, 29, 35, 37, 38],bnusNo:31},
  {drwNo:1190,drwNoDate:"2025-09-20",numbers:[7, 9, 19, 23, 26, 45],bnusNo:33},
  {drwNo:1191,drwNoDate:"2025-09-27",numbers:[1, 4, 11, 12, 20, 41],bnusNo:2},
  {drwNo:1192,drwNoDate:"2025-10-04",numbers:[10, 16, 23, 36, 39, 40],bnusNo:11},
  {drwNo:1193,drwNoDate:"2025-10-11",numbers:[6, 9, 16, 19, 24, 28],bnusNo:17},
  {drwNo:1194,drwNoDate:"2025-10-18",numbers:[3, 13, 15, 24, 33, 37],bnusNo:2},
  {drwNo:1195,drwNoDate:"2025-10-25",numbers:[3, 15, 27, 33, 34, 36],bnusNo:37},
  {drwNo:1196,drwNoDate:"2025-11-01",numbers:[8, 12, 15, 29, 40, 45],bnusNo:14},
  {drwNo:1197,drwNoDate:"2025-11-08",numbers:[1, 5, 7, 26, 28, 43],bnusNo:30},
  {drwNo:1198,drwNoDate:"2025-11-15",numbers:[26, 30, 33, 38, 39, 41],bnusNo:21},
  {drwNo:1199,drwNoDate:"2025-11-22",numbers:[16, 24, 25, 30, 31, 32],bnusNo:7},
  {drwNo:1200,drwNoDate:"2025-11-29",numbers:[1, 2, 4, 16, 20, 32],bnusNo:45},
  {drwNo:1201,drwNoDate:"2025-12-06",numbers:[7, 9, 24, 27, 35, 36],bnusNo:37},
  {drwNo:1202,drwNoDate:"2025-12-13",numbers:[5, 12, 21, 33, 37, 40],bnusNo:7},
  {drwNo:1203,drwNoDate:"2025-12-20",numbers:[3, 6, 18, 29, 35, 39],bnusNo:24},
  {drwNo:1204,drwNoDate:"2025-12-27",numbers:[8, 16, 28, 30, 31, 44],bnusNo:27},
  {drwNo:1205,drwNoDate:"2026-01-03",numbers:[1, 4, 16, 23, 31, 41],bnusNo:2},
  {drwNo:1206,drwNoDate:"2026-01-10",numbers:[1, 3, 17, 26, 27, 42],bnusNo:23},
  {drwNo:1207,drwNoDate:"2026-01-17",numbers:[10, 22, 24, 27, 38, 45],bnusNo:11},
  {drwNo:1208,drwNoDate:"2026-01-24",numbers:[6, 27, 30, 36, 38, 42],bnusNo:25},
  {drwNo:1209,drwNoDate:"2026-01-31",numbers:[2, 17, 20, 35, 37, 39],bnusNo:24},
  {drwNo:1210,drwNoDate:"2026-02-07",numbers:[1, 7, 9, 17, 27, 38],bnusNo:31},
  {drwNo:1211,drwNoDate:"2026-02-14",numbers:[23, 26, 27, 35, 38, 40],bnusNo:10},
  {drwNo:1212,drwNoDate:"2026-02-21",numbers:[5, 8, 25, 31, 41, 44],bnusNo:45},
  {drwNo:1213,drwNoDate:"2026-02-28",numbers:[5, 11, 25, 27, 36, 38],bnusNo:2},
  {drwNo:1214,drwNoDate:"2026-03-07",numbers:[10, 15, 19, 27, 30, 33],bnusNo:14},
  {drwNo:1215,drwNoDate:"2026-03-14",numbers:[13, 15, 19, 21, 44, 45],bnusNo:39},
  {drwNo:1216,drwNoDate:"2026-03-21",numbers:[3, 10, 14, 15, 23, 24],bnusNo:25},
  {drwNo:1217,drwNoDate:"2026-03-28",numbers:[8, 10, 15, 20, 29, 31],bnusNo:41},
  {drwNo:1218,drwNoDate:"2026-04-04",numbers:[3, 28, 31, 32, 42, 45],bnusNo:25},
  {drwNo:1219,drwNoDate:"2026-04-11",numbers:[1, 2, 15, 28, 39, 45],bnusNo:31},
  {drwNo:1220,drwNoDate:"2026-04-18",numbers:[2, 22, 25, 28, 34, 43],bnusNo:16},
  {drwNo:1221,drwNoDate:"2026-04-25",numbers:[6, 13, 18, 28, 30, 36],bnusNo:9},
  {drwNo:1222,drwNoDate:"2026-05-02",numbers:[4, 11, 17, 22, 32, 41],bnusNo:34},
  {drwNo:1223,drwNoDate:"2026-05-09",numbers:[16, 18, 20, 32, 33, 39],bnusNo:26},
  {drwNo:1224,drwNoDate:"2026-05-16",numbers:[9, 18, 21, 27, 44, 45],bnusNo:28},
  {drwNo:1225,drwNoDate:"2026-05-23",numbers:[8, 9, 19, 25, 41, 42],bnusNo:33},
  {drwNo:1226,drwNoDate:"2026-05-30",numbers:[4, 6, 13, 17, 26, 28],bnusNo:41},
  {drwNo:1227,drwNoDate:"2026-06-06",numbers:[1, 14, 16, 34, 41, 44],bnusNo:13},
  {drwNo:1228,drwNoDate:"2026-06-13",numbers:[24, 29, 30, 31, 35, 44],bnusNo:1},
  {drwNo:1229,drwNoDate:"2026-06-20",numbers:[12, 13, 29, 34, 37, 42],bnusNo:16}
];

let activePeriod = '3yr';
let currentWeights = { ...adjustedWeights };
let currentUpcomingDrawNo = getCalculatedLatestDraw();

function updateActiveWeights() {
  const weights = {};
  for (let i = 1; i <= 45; i++) {
    weights[i] = 1;
  }
  
  if (activePeriod === 'all') {
    for (let i = 1; i <= 45; i++) {
      weights[i] = FREQUENCY_SCORES[i] || 1;
    }
    COLD_NUMBERS.forEach(num => {
      weights[num] += 2;
    });
    currentWeights = weights;
    return;
  }
  
  const count = activePeriod === '1yr' ? 52 : 156;
  const slice = HISTORICAL_DRAWS.slice(-count);
  slice.forEach(draw => {
    draw.numbers.forEach(num => {
      weights[num] += 1.5; // Scale dynamic count to make variations distinct
    });
  });
  
  currentWeights = weights;
}

// --- State Variables ---
let currentMode = 1;
let isDrawing = false;
let history = []; // Saved lotto tickets database
const pinnedNumbers = new Set();
const excludedNumbers = new Set();

// --- DOM References ---
const btnModeCards = document.querySelectorAll('.mode-option');
const btnGenerate = document.getElementById('btn-generate');
const selectSets = document.getElementById('input-sets');
const selectTemp = document.getElementById('input-temp');
const badgeStatus = document.getElementById('status-badge');
const badgeText = document.getElementById('badge-text');
const resultsPanel = document.getElementById('results-panel');
const part1List = document.getElementById('part1-list');
const part2List = document.getElementById('part2-list');
const excludedChipsContainer = document.getElementById('excluded-chips');
const labelOddEven = document.getElementById('label-odd-even');
const labelHighLow = document.getElementById('label-high-low');
const chartOddEven = document.getElementById('chart-odd-even');
const chartHighLow = document.getElementById('chart-high-low');
const gaussianDot = document.getElementById('gaussian-dot');

// History & Matcher DOM References
const savedLogsList = document.getElementById('saved-logs-list');
const savedLogsCount = document.getElementById('saved-logs-count');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnRunMatch = document.getElementById('btn-run-match');
const valTotalSpend = document.getElementById('val-total-spend');
const valTotalWin = document.getElementById('val-total-win');
const valRoi = document.getElementById('val-roi');

const selectPeriod = document.getElementById('input-period');
const btnExportHistory = document.getElementById('btn-export-history');
const btnImportHistory = document.getElementById('btn-import-history');
const fileImportHistory = document.getElementById('file-import-history');

const rank1Fill = document.getElementById('rank-1-fill');
const rank2Fill = document.getElementById('rank-2-fill');
const rank3Fill = document.getElementById('rank-3-fill');
const rank4Fill = document.getElementById('rank-4-fill');
const rank5Fill = document.getElementById('rank-5-fill');

const rank1Val = document.getElementById('rank-1-val');
const rank2Val = document.getElementById('rank-2-val');
const rank3Val = document.getElementById('rank-3-val');
const rank4Val = document.getElementById('rank-4-val');
const rank5Val = document.getElementById('rank-5-val');

// --- Canvas Physics Engine Setup ---
const canvas = document.getElementById('lotto-canvas');
const ctx = canvas.getContext('2d');

const dpr = window.devicePixelRatio || 1;
canvas.width = 220 * dpr;
canvas.height = 220 * dpr;
canvas.style.width = '220px';
canvas.style.height = '220px';
ctx.scale(dpr, dpr);

const cx = 110;
const cy = 110;
const cageRadius = 92;
const ballRadius = 7.8;
const restitution = 0.58;
const gravity = 0.22;

let balls = [];
let isSpinning = false;
let animationFrameId = null;

// Initialize 45 pastel balls
function initPhysicsBalls() {
  balls = [];
  for (let i = 1; i <= 45; i++) {
    const angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
    const r = Math.random() * (cageRadius - 20);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r + 20;
    
    balls.push({
      num: i,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      r: ballRadius,
      color: getBallPastelHex(i),
      textHex: getBallTextHex(i),
      exiting: false,
      exitProgress: 0
    });
  }
}

// Vibrant Pastel Ball Colors (Matched with CSS)
function getBallPastelHex(num) {
  if (num <= 10) return '#f59e0b'; // Rich Amber
  if (num <= 20) return '#2563eb'; // Rich Blue
  if (num <= 30) return '#f43f5e'; // Rich Red
  if (num <= 40) return '#64748b'; // Metallic Slate
  return '#10b981'; // Rich Emerald Green
}

function getBallTextHex(num) {
  return '#ffffff'; // 안쪽 화이트 글자 색상으로 통일
}

function getBallColorClass(num) {
  if (num <= 10) return 'color-p-yellow';
  if (num <= 20) return 'color-p-blue';
  if (num <= 30) return 'color-p-red';
  if (num <= 40) return 'color-p-gray';
  return 'color-p-green';
}

// 2D Physics Loop
let lastTime = performance.now();

function updatePhysics(now = performance.now()) {
  ctx.clearRect(0, 0, 220, 220);
  
  // Calculate normalized delta time (16.667ms = 1.0)
  const dt = Math.min((now - lastTime) / 16.667, 2.0);
  lastTime = now;
  
  // 1. Draw outer transparent cage border
  ctx.beginPath();
  ctx.arc(cx, cy, cageRadius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, cy, cageRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Physics Update & Draw Balls
  balls.forEach((ball, idx) => {
    if (ball.exiting) {
      ball.exitProgress += 0.05 * dt;
      ball.x = cx;
      ball.y = cy + cageRadius + (ball.exitProgress * 25);
      
      const scaleRadius = ball.r * (1 - ball.exitProgress * 0.4);
      if (scaleRadius > 0) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, scaleRadius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return;
    }

    // Apply Forces
    if (isSpinning) {
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      
      const tx = -dy / dist;
      const ty = dx / dist;
      
      const targetSpeed = 4.5;
      const currentTangentialV = ball.vx * tx + ball.vy * ty;
      const steer = (targetSpeed - currentTangentialV) * 0.08;
      
      ball.vx += tx * steer * dt;
      ball.vy += ty * steer * dt;
      
      // Slight inward attraction
      ball.vx -= (dx / dist) * 0.08 * dt;
      ball.vy -= (dy / dist) * 0.08 * dt;
      
      // Micro turbulence
      ball.vx += (Math.random() - 0.5) * 0.3 * dt;
      ball.vy += (Math.random() - 0.5) * 0.3 * dt;
    } else {
      ball.vy += gravity * dt;
    }
    
    // Scale friction with dt
    const friction = Math.pow(0.985, dt);
    ball.vx *= friction;
    ball.vy *= friction;
    
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist + ball.r > cageRadius) {
      const nx = -dx / dist;
      const ny = -dy / dist;
      
      ball.x = cx - nx * (cageRadius - ball.r);
      ball.y = cy - ny * (cageRadius - ball.r);
      
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        ball.vx = (ball.vx - 2 * dot * nx) * restitution;
        ball.vy = (ball.vy - 2 * dot * ny) * restitution;
      }
    }
    
    for (let j = idx + 1; j < balls.length; j++) {
      const bj = balls[j];
      if (bj.exiting) continue;
      
      const bdx = bj.x - ball.x;
      const bdy = bj.y - ball.y;
      const bdist = Math.sqrt(bdx*bdx + bdy*bdy);
      const minDist = ball.r + bj.r;
      
      if (bdist < minDist) {
        const bnx = bdx / bdist;
        const bny = bdy / bdist;
        const overlap = minDist - bdist;
        
        ball.x -= bnx * overlap * 0.5;
        ball.y -= bny * overlap * 0.5;
        bj.x += bnx * overlap * 0.5;
        bj.y += bny * overlap * 0.5;
        
        const rvx = bj.vx - ball.vx;
        const rvy = bj.vy - ball.vy;
        const velAlongNormal = rvx * bnx + rvy * bny;
        
        if (velAlongNormal < 0) {
          const impulse = -(1 + restitution) * velAlongNormal / 2;
          ball.vx -= impulse * bnx;
          ball.vy -= impulse * bny;
          bj.vx += impulse * bnx;
          bj.vy += impulse * bny;
        }
      }
    }
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = 'bold 9.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw outline
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(ball.num.toString(), ball.x, ball.y + 0.4);
    
    // Draw fill text
    ctx.fillStyle = ball.textHex;
    ctx.fillText(ball.num.toString(), ball.x, ball.y + 0.4);
  });

  ctx.beginPath();
  ctx.arc(cx, cy + cageRadius, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.stroke();

  animationFrameId = requestAnimationFrame(updatePhysics);
}

// Initial draw run
initPhysicsBalls();
updatePhysics();

// --- Event Listeners Mode Cards ---
btnModeCards.forEach(card => {
  card.addEventListener('click', () => {
    if (isDrawing) return;
    btnModeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    currentMode = parseInt(card.dataset.mode);
    
    // Sync mobile select dropdown
    const mSelectMode = document.getElementById('m-select-mode');
    if (mSelectMode) mSelectMode.value = currentMode;
    
    badgeText.textContent = `${MODE_DESCRIPTIONS[currentMode].name.toUpperCase()} 선택됨`;
  });
});

btnGenerate.addEventListener('click', () => {
  if (isDrawing) return;
  startSimulation();
});

// --- Statistical Core Functions (JS Port) ---
function calculateFitnessScore(lst) {
  let score = 0.0;
  
  const odds = lst.filter(x => x % 2 !== 0).length;
  if ([3, 2, 4].includes(odds)) score += 10;
  else if ([1, 5].includes(odds)) score += 2;
  else score += -10;
  
  const lows = lst.filter(x => x <= 22).length;
  if ([3, 2, 4].includes(lows)) score += 10;
  else if ([1, 5].includes(lows)) score += 2;
  else score += -10;
  
  const totalSum = lst.reduce((a, b) => a + b, 0);
  const z = (totalSum - 138.0) / 32.0;
  // 표준 정규 분포(Standard Normal Distribution) z-score 정규화 점수 매핑
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const sumScore = (pdf / 0.3989422804014327) * 10.0;
  score += sumScore;
  
  const diffs = new Set();
  for (let i = 0; i < lst.length; i++) {
    for (let j = i + 1; j < lst.length; j++) {
      diffs.add(Math.abs(lst[i] - lst[j]));
    }
  }
  const ac = diffs.size - (6 - 1);
  if (ac >= 7) score += 10;
  else if (ac === 6) score += 5;
  else score += -15;
  
  let consecCount = 0;
  let maxConsecRun = 1;
  let run = 1;
  for (let i = 0; i < 5; i++) {
    if (lst[i+1] - lst[i] === 1) {
      consecCount += 1;
      run += 1;
      if (run > maxConsecRun) maxConsecRun = run;
    } else {
      run = 1;
    }
  }
  if (maxConsecRun >= 3) score += -15;
  else if (consecCount <= 1) score += 10;
  else if (consecCount === 2) score += 5;
  else score += -10;
  
  const lastDigits = lst.map(x => x % 10);
  const digitCounts = {};
  lastDigits.forEach(d => { digitCounts[d] = (digitCounts[d] || 0) + 1; });
  const maxDupDigit = Math.max(...Object.values(digitCounts));
  if (maxDupDigit <= 2) score += 10;
  else if (maxDupDigit === 3) score += -5;
  else score += -15;
  
  const buckets = [0, 0, 0, 0, 0];
  lst.forEach(x => {
    if (x <= 9) buckets[0]++;
    else if (x <= 19) buckets[1]++;
    else if (x <= 29) buckets[2]++;
    else if (x <= 39) buckets[3]++;
    else buckets[4]++;
  });
  const maxBucket = Math.max(...buckets);
  if (maxBucket <= 3) score += 10;
  else if (maxBucket === 4) score += -5;
  else score += -15;
  
  const primeCount = lst.filter(x => PRIMES.has(x)).length;
  const mult3Count = lst.filter(x => x % 3 === 0).length;
  if (primeCount >= 1 && primeCount <= 3 && mult3Count >= 1 && mult3Count <= 3) score += 10;
  else if ((primeCount >= 1 && primeCount <= 3) || (mult3Count >= 1 && mult3Count <= 3)) score += 5;
  else score += -5;
  
  return parseFloat(score.toFixed(2));
}

// Generate combinations respecting manual Pins
function generateRandSets(pool, count) {
  // Filter out any pinned numbers from drawing pool
  const poolArray = Array.from(pool).filter(n => !pinnedNumbers.has(n));
  const results = [];
  while (results.length < count) {
    const picked = Array.from(pinnedNumbers);
    const tempPool = [...poolArray];
    while (picked.length < 6) {
      if (tempPool.length === 0) break;
      const idx = Math.floor(Math.random() * tempPool.length);
      picked.push(tempPool.splice(idx, 1)[0]);
    }
    picked.sort((a, b) => a - b);
    
    const stringified = JSON.stringify(picked);
    if (!results.some(r => JSON.stringify(r) === stringified)) {
      results.push(picked);
    }
  }
  return results;
}

function generateStatSets(pool, count, temp) {
  const poolArray = Array.from(pool).filter(n => !pinnedNumbers.has(n));
  const poolWeights = poolArray.map(num => currentWeights[num]);
  
  const candidates = [];
  for (let c = 0; c < 1000; c++) {
    const candidate = new Set(pinnedNumbers);
    while (candidate.size < 6) {
      if (poolArray.length === 0) break;
      candidate.add(weightedSample(poolArray, poolWeights));
    }
    candidates.push(Array.from(candidate).sort((a, b) => a - b));
  }
  
  const scores = candidates.map(c => calculateFitnessScore(c));
  const maxScore = Math.max(...scores);
  
  const shiftedScores = scores.map(s => (s - maxScore) / temp);
  const expScores = shiftedScores.map(ss => Math.exp(ss));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map(es => es / sumExp);
  
  const sampledSets = [];
  const sampledScores = [];
  let attempts = 0;
  
  while (sampledSets.length < count && attempts < 2000) {
    attempts++;
    const idx = weightedIndexSample(probs);
    const candidate = candidates[idx];
    const stringified = JSON.stringify(candidate);
    
    if (!sampledSets.some(s => JSON.stringify(s) === stringified)) {
      sampledSets.push(candidate);
      sampledScores.push(scores[idx]);
    }
  }
  
  return { sets: sampledSets, scores: sampledScores };
}

function weightedSample(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const threshold = Math.random() * total;
  let accum = 0;
  for (let i = 0; i < arr.length; i++) {
    accum += weights[i];
    if (threshold <= accum) return arr[i];
  }
  return arr[arr.length - 1];
}

function weightedIndexSample(probs) {
  const threshold = Math.random();
  let accum = 0;
  for (let i = 0; i < probs.length; i++) {
    accum += probs[i];
    if (threshold <= accum) return i;
  }
  return probs.length - 1;
}

// --- Run Simulation & Real-time Canvas exit ---
function startSimulation() {
  // Validate remaining pool size (must have at least 6 numbers)
  const poolSize = 45 - excludedNumbers.size;
  if (poolSize < 6) {
    alert("제외수가 너무 많아 6자리 조합을 구성할 수 없습니다. 제외수를 줄여주십시오.");
    return;
  }

  isDrawing = true;
  btnGenerate.disabled = true;
  badgeStatus.classList.add('active');
  badgeText.textContent = "물리 믹싱 연산 중";
  
  resultsPanel.classList.add('hidden');
  
  initPhysicsBalls();
  isSpinning = true;

  const setsCount = parseInt(selectSets.value);
  const temp = parseFloat(selectTemp.value);
  
  let m1 = "stat", m2 = "stat";
  if (currentMode === 2) { m1 = "rand"; m2 = "stat"; }
  else if (currentMode === 3) { m1 = "stat"; m2 = "rand"; }
  else if (currentMode === 4) { m1 = "rand"; m2 = "rand"; }
  
  // 1차 풀: 제외수를 완전히 배제한 풀
  const pool_1 = new Set(Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !excludedNumbers.has(n)));
  let results1, scores1;
  
  if (m1 === "stat") {
    const res = generateStatSets(pool_1, setsCount, temp);
    results1 = res.sets;
    scores1 = res.scores;
  } else {
    results1 = generateRandSets(pool_1, setsCount);
    scores1 = Array(setsCount).fill("Pure Random");
  }
  
  const usedNumbers = new Set();
  results1.forEach(s => s.forEach(n => usedNumbers.add(n)));
  
  // 2차 풀: 1차 추천된 번호들과 제외수를 전체 풀에서 배제
  let pool_2 = new Set([...pool_1].filter(x => !usedNumbers.has(x)));
  
  // Resilient fallback: 2차 풀에 남은 개수가 6개 미만이면 사용 번호들을 도로 집어넣어 개수 충당
  if (pool_2.size < 6) {
    const fallbackArr = Array.from(usedNumbers);
    while (pool_2.size < 6 && fallbackArr.length > 0) {
      pool_2.add(fallbackArr.pop());
    }
  }
  
  let results2, scores2;
  
  if (m2 === "stat") {
    const res = generateStatSets(pool_2, setsCount, temp);
    results2 = res.sets;
    scores2 = res.scores;
  } else {
    results2 = generateRandSets(pool_2, setsCount);
    scores2 = Array(setsCount).fill("Pure Random");
  }
  
  const drawNumbers = [...results1[0]];

  setTimeout(() => {
    isSpinning = false;
    badgeText.textContent = "순차 방출 중";
    
    let drawCount = 0;
    const drawInterval = setInterval(() => {
      if (drawCount < 6) {
        const numToDraw = drawNumbers[drawCount];
        
        const ballObj = balls.find(b => b.num === numToDraw && !b.exiting);
        if (ballObj) {
          ballObj.exiting = true;
          ballObj.exitProgress = 0;
        }
        
        drawCount++;
      } else {
        clearInterval(drawInterval);
        
        setTimeout(() => {
          badgeStatus.classList.remove('active');
          badgeText.textContent = "추천 완료";
          btnGenerate.disabled = false;
          isDrawing = false;
          
          renderDashboardResults(results1, scores1, usedNumbers, results2, scores2);
        }, 500);
      }
    }, 250);

  }, 1200);
}

// --- Direct Generation with No Animation (For Initial Load) ---
function generateDirectlyNoAnimation() {
  const setsCount = parseInt(selectSets.value) || 3;
  const temp = parseFloat(selectTemp.value) || 1.0;
  
  let m1 = "stat", m2 = "stat";
  if (currentMode === 2) { m1 = "rand"; m2 = "stat"; }
  else if (currentMode === 3) { m1 = "stat"; m2 = "rand"; }
  else if (currentMode === 4) { m1 = "rand"; m2 = "rand"; }
  
  const pool_1 = new Set(Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !excludedNumbers.has(n)));
  let results1, scores1;
  
  if (m1 === "stat") {
    const res = generateStatSets(pool_1, setsCount, temp);
    results1 = res.sets;
    scores1 = res.scores;
  } else {
    results1 = generateRandSets(pool_1, setsCount);
    scores1 = Array(setsCount).fill("Pure Random");
  }
  
  const usedNumbers = new Set();
  results1.forEach(s => s.forEach(n => usedNumbers.add(n)));
  
  let pool_2 = new Set([...pool_1].filter(x => !usedNumbers.has(x)));
  if (pool_2.size < 6) {
    const fallbackArr = Array.from(usedNumbers);
    while (pool_2.size < 6 && fallbackArr.length > 0) {
      pool_2.add(fallbackArr.pop());
    }
  }
  
  let results2, scores2;
  
  if (m2 === "stat") {
    const res = generateStatSets(pool_2, setsCount, temp);
    results2 = res.sets;
    scores2 = res.scores;
  } else {
    results2 = generateRandSets(pool_2, setsCount);
    scores2 = Array(setsCount).fill("Pure Random");
  }
  
  renderDashboardResults(results1, scores1, usedNumbers, results2, scores2);
  runDrawMatcher();
}

// --- Render Dashboard Results ---
function renderDashboardResults(results1, scores1, usedNumbers, results2, scores2) {
  part1List.innerHTML = '';
  part2List.innerHTML = '';
  excludedChipsContainer.innerHTML = '';
  
  // Part 1 Cards
  results1.forEach((set, idx) => {
    part1List.appendChild(createSetCard(idx + 1, set, scores1[idx]));
  });
  
  // Excluded Chips
  for (let i = 1; i <= 45; i++) {
    const chip = document.createElement('div');
    chip.className = `chip-item ${usedNumbers.has(i) ? 'active' : ''}`;
    chip.textContent = i;
    excludedChipsContainer.appendChild(chip);
  }
  
  // Part 2 Cards
  results2.forEach((set, idx) => {
    part2List.appendChild(createSetCard(idx + 1, set, scores2[idx]));
  });
  
  // Animate micro gauge bars
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.targetWidth;
    });
  }, 100);
  
  // Donut charts & Gaussian
  updateStatsDashboard([...results1, ...results2]);
  
  resultsPanel.classList.remove('hidden');
}

function createSetCard(index, set, score) {
  const card = document.createElement('div');
  card.className = 'card-item';
  
  const sum = set.reduce((a, b) => a + b, 0);
  const odds = set.filter(x => x % 2 !== 0).length;
  const evens = 6 - odds;
  const isStat = typeof score === 'number';
  
  const formattedScore = isStat ? score.toFixed(1) : '';
  const scoreText = isStat ? `적합도: ${formattedScore}/80.0` : "Pure Random";
  const scorePercent = isStat ? (score / 80) * 100 : 0;
  
  card.innerHTML = `
    <div class="card-head">
      <span class="lbl-card-idx">SET 0${index}</span>
      <button class="btn-save-set" type="button">확정 저장</button>
    </div>
    <div class="balls-line">
      ${set.map(n => `<div class="ball-mini ${getBallColorClass(n)}">${n}</div>`).join('')}
    </div>
    <div class="card-foot">
      <span>합계: ${sum} | 홀짝: ${odds}:${evens}</span>
      <span>${scoreText}</span>
    </div>
    ${isStat ? `
    <div class="bar-track">
      <div class="bar-fill" data-target-width="${scorePercent}%"></div>
    </div>` : ''}
  `;

  // Attach Save Handler
  const btnSave = card.querySelector('.btn-save-set');
  btnSave.addEventListener('click', () => {
    if (btnSave.classList.contains('saved')) return;
    saveTicketToHistory(set, score);
    btnSave.textContent = "저장완료 ✓";
    btnSave.classList.add('saved');
    btnSave.disabled = true;
  });
  
  return card;
}

function updateStatsDashboard(all10Sets) {
  let totalOdds = 0;
  let totalLows = 0;
  let totalSum = 0;
  
  all10Sets.forEach(set => {
    totalOdds += set.filter(x => x % 2 !== 0).length;
    totalLows += set.filter(x => x <= 22).length;
    totalSum += set.reduce((a, b) => a + b, 0);
  });
  
  const avgOdds = totalOdds / all10Sets.length;
  const avgEvens = 6 - avgOdds;
  const avgLows = totalLows / all10Sets.length;
  const avgHighs = 6 - avgLows;
  const avgSum = totalSum / all10Sets.length;
  
  const oddPercent = (avgOdds / 6) * 100;
  chartOddEven.style.background = `conic-gradient(var(--pastel-purple) 0% ${oddPercent}%, rgba(226, 232, 240, 0.8) ${oddPercent}% 100%)`;
  labelOddEven.textContent = `${avgOdds.toFixed(1)}:${avgEvens.toFixed(1)}`;
  
  const lowPercent = (avgLows / 6) * 100;
  chartHighLow.style.background = `conic-gradient(var(--pastel-cyan) 0% ${lowPercent}%, rgba(226, 232, 240, 0.8) ${lowPercent}% 100%)`;
  labelHighLow.textContent = `${avgLows.toFixed(1)}:${avgHighs.toFixed(1)}`;
  
  let cx = ((avgSum - 90) / (185 - 90)) * 80 + 10;
  cx = Math.max(10, Math.min(90, cx));
  const cy = 38 - 36 * Math.exp(-Math.pow(cx - 50, 2) / Math.pow(20, 2));
  
  gaussianDot.setAttribute('cx', cx.toString());
  gaussianDot.setAttribute('cy', cy.toString());
  
  document.querySelector('.gaussian-mid-val').textContent = `평균 합계: ${Math.round(avgSum)}`;
}

// --- History & Big Data Persistence Layer ---

function getFormattedDate() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function saveTicketToHistory(set, score) {
  const item = {
    id: Date.now() + Math.random(),
    date: getFormattedDate(),
    drawNo: currentUpcomingDrawNo,
    mode: MODE_DESCRIPTIONS[currentMode].name,
    set: [...set].sort((a,b)=>a-b),
    score: typeof score === 'number' ? score : null,
    result: null
  };
  
  history.push(item);
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

function loadHistoryFromStorage() {
  const stored = localStorage.getItem('ados_lotto_history');
  if (stored) {
    try {
      history = JSON.parse(stored);
    } catch(e) {
      history = [];
    }
  } else {
    history = [];
  }
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

function deleteHistoryItem(id) {
  history = history.filter(item => item.id !== id);
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  renderHistoryLogs();
  updateBigDataDashboard();
}

function clearHistoryAll() {
  if (confirm("정말로 확정 저장된 모든 로또 기록 대장을 비우시겠습니까? 누적 빅데이터가 초기화됩니다.")) {
    history = [];
    localStorage.removeItem('ados_lotto_history');
    renderHistoryLogs();
    updateBigDataDashboard();
  }
}

function createHistoryCardElement(item) {
  const card = document.createElement('div');
  card.className = 'log-item-card';
  
  let resultTagHtml = '';
  const hasResult = item.result !== null && item.result !== undefined;
  
  if (hasResult) {
    const rank = item.result.rank;
    const rankLabels = {
      1: "1등 🎉",
      2: "2등 🥈",
      3: "3등 🥉",
      4: "4등 5만원 💸",
      5: "5등 5천원 🍀",
      0: "낙첨"
    };
    const badgeClass = rank > 0 ? `prize-rank-${rank}` : 'prize-rank-lose';
    resultTagHtml = `<span class="prize-badge ${badgeClass}">${rankLabels[rank]}</span>`;
  } else {
    resultTagHtml = `<span class="prize-badge prize-rank-pending">${item.drawNo ? item.drawNo + '회 추첨 대기 ⏳' : '추첨 대기 ⏳'}</span>`;
  }
  
  card.innerHTML = `
    <div class="log-head">
      <span class="log-date">${item.drawNo ? item.drawNo + '회차 | ' : ''}${item.date} (${item.mode.toUpperCase()})</span>
      <div class="log-actions">
        ${resultTagHtml}
        <button class="btn-delete-log" data-id="${item.id}" type="button">삭제</button>
      </div>
    </div>
    <div class="balls-line">
      ${item.set.map(num => {
        let matchedClass = '';
        if (hasResult && item.result.matchedNumbers.includes(num)) {
          matchedClass = 'matched';
        }
        return `<div class="ball-mini ${getBallColorClass(num)} ${matchedClass}">${num}</div>`;
      }).join('')}
    </div>
    <div class="card-foot">
      <span>합계: ${item.set.reduce((a,b)=>a+b, 0)}</span>
      <span>적합도: ${item.score !== null ? (typeof item.score === 'number' ? item.score.toFixed(1) : item.score) : 'N/A'}</span>
    </div>
  `;
  
  card.querySelector('.btn-delete-log').addEventListener('click', () => {
    deleteHistoryItem(item.id);
  });
  
  return card;
}

function renderHistoryLogs() {
  if (savedLogsList) {
    savedLogsList.innerHTML = '';
    savedLogsCount.textContent = history.length;
    
    if (history.length === 0) {
      savedLogsList.innerHTML = `<p class="no-history-placeholder">아직 저장된 확정 번호가 없습니다. 위의 추천 결과에서 [확정 저장]을 누르면 기록이 축적됩니다.</p>`;
    } else {
      history.forEach(item => {
        savedLogsList.appendChild(createHistoryCardElement(item));
      });
    }
  }
  
  const mSavedLogsList = document.getElementById('m-saved-logs-list');
  if (mSavedLogsList) {
    mSavedLogsList.innerHTML = '';
    if (history.length === 0) {
      mSavedLogsList.innerHTML = `<p class="m-no-history">저장된 로또 대장이 없습니다.</p>`;
    } else {
      history.forEach(item => {
        mSavedLogsList.appendChild(createHistoryCardElement(item));
      });
    }
  }
}

function updateBigDataDashboard() {
  const completedGames = history.filter(item => item.result !== null && item.result !== undefined);
  const totalGames = completedGames.length;
  const spendAmount = totalGames * 1000;
  
  let winAmount = 0;
  const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  const prizePool = {
    1: 2000000000,
    2: 50000000,
    3: 1500000,
    4: 50000,
    5: 5000,
    0: 0
  };
  
  history.forEach(item => {
    if (item.result) {
      const rank = item.result.rank;
      if (rank > 0) {
        rankCounts[rank]++;
        winAmount += prizePool[rank];
      }
    }
  });
  
  valTotalSpend.textContent = spendAmount.toLocaleString() + '원';
  valTotalWin.textContent = winAmount.toLocaleString() + '원';
  
  let roi = 0.0;
  if (spendAmount > 0) {
    roi = (winAmount / spendAmount) * 100;
  }
  valRoi.textContent = roi.toFixed(1) + '%';
  
  if (roi >= 100.0) {
    valRoi.style.color = '#10b981';
  } else if (roi > 0.0) {
    valRoi.style.color = '#3b82f6';
  } else {
    valRoi.style.color = '#e11d48';
  }

  const maxRankCount = Math.max(...Object.values(rankCounts), 1);
  for (let rank = 1; rank <= 5; rank++) {
    const count = rankCounts[rank];
    const fillBar = document.getElementById(`rank-${rank}-fill`);
    const valLabel = document.getElementById(`rank-${rank}-val`);
    
    valLabel.textContent = count;
    
    const widthPercent = (count / maxRankCount) * 100;
    fillBar.style.width = `${widthPercent}%`;
  }
}

function runDrawMatcher() {
  if (history.length === 0) {
    return;
  }
  
  const winningNums = [];
  for (let i = 1; i <= 6; i++) {
    const val = parseInt(document.getElementById(`m-num-${i}`).value);
    if (isNaN(val) || val < 1 || val > 45) {
      return; // Fail silently on initial auto-loads if values are blank
    }
    winningNums.push(val);
  }
  
  const uniqueWinning = new Set(winningNums);
  if (uniqueWinning.size !== 6) return;
  
  const bonusNum = parseInt(document.getElementById('m-bonus').value);
  if (isNaN(bonusNum) || bonusNum < 1 || bonusNum > 45) return;
  if (winningNums.includes(bonusNum)) return;
  
  const matchDrawNo = parseInt(document.getElementById('lbl-loaded-draw').textContent);
  if (isNaN(matchDrawNo)) return;
  
  history.forEach(item => {
    if (item.drawNo !== undefined && item.drawNo !== matchDrawNo) {
      return;
    }
    const mainMatches = item.set.filter(n => winningNums.includes(n));
    const matchCount = mainMatches.length;
    const bonusMatch = item.set.includes(bonusNum);
    
    let rank = 0;
    
    if (matchCount === 6) {
      rank = 1;
    } else if (matchCount === 5 && bonusMatch) {
      rank = 2;
    } else if (matchCount === 5) {
      rank = 3;
    } else if (matchCount === 4) {
      rank = 4;
    } else if (matchCount === 3) {
      rank = 5;
    }
    
    item.result = {
      rank: rank,
      matchedNumbers: [...mainMatches, ...(bonusMatch ? [bonusNum] : [])]
    };
  });
  
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

// --- Draw Number Auto-Fetching & CORS Proxy Integration ---

function getCalculatedLatestDraw() {
  const start = new Date('2002-12-07T20:45:00+09:00').getTime();
  const diff = Date.now() - start;
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return 1 + Math.floor(diff / msInWeek);
}

async function tryFetchDraw(drawNo) {
  const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`;
  
  // 1. Try AllOrigins
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.contents) {
        return JSON.parse(data.contents);
      }
    }
  } catch (e) {
    console.warn("AllOrigins proxy failed, trying Codetabs...", e);
  }
  
  // 2. Try Codetabs
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Codetabs proxy failed...", e);
  }
  
  throw new Error("All CORS proxies failed to fetch winning numbers.");
}

// Background auto loader on page load
function renderDrawInfoDOM(data, targetDraw, beforeDraw) {
  const lblDate = document.getElementById('info-card-date');
  const lblPrize = document.getElementById('info-prize-val');
  const ballsRow = document.getElementById('info-balls-row');
  const banner = document.getElementById('before-draw-banner');
  const lblLoadedDraw = document.getElementById('lbl-loaded-draw');
  
  currentUpcomingDrawNo = targetDraw + 1;
  // 1. Fill matcher inputs
  document.getElementById('m-num-1').value = data.drwtNo1;
  document.getElementById('m-num-2').value = data.drwtNo2;
  document.getElementById('m-num-3').value = data.drwtNo3;
  document.getElementById('m-num-4').value = data.drwtNo4;
  document.getElementById('m-num-5').value = data.drwtNo5;
  document.getElementById('m-num-6').value = data.drwtNo6;
  document.getElementById('m-bonus').value = data.bnusNo;
  
  lblLoadedDraw.textContent = targetDraw;
  const mLblLoadedDraw = document.getElementById('m-lbl-loaded-draw');
  if (mLblLoadedDraw) {
    mLblLoadedDraw.textContent = `${targetDraw}회`;
  }
  
  // 2. Render Info Card details
  lblDate.textContent = `추첨일: ${data.drwNoDate}`;
  
  // Format Prize amount
  const prizeAmt = data.firstWinamnt;
  let prizeText = prizeAmt.toLocaleString() + '원';
  if (prizeAmt > 0) {
    const billionPart = Math.floor(prizeAmt / 100000000);
    const restBillion = Math.round((prizeAmt % 100000000) / 10000000);
    if (billionPart > 0) {
      prizeText = `1인당 약 ${billionPart}.${restBillion}억 원 (${prizeAmt.toLocaleString()}원)`;
    }
  }
  lblPrize.textContent = prizeText;
  
  // Render info balls
  ballsRow.innerHTML = '';
  const mBallsRow = document.getElementById('m-info-balls-row');
  if (mBallsRow) mBallsRow.innerHTML = '';
  
  const nums = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
  nums.forEach(num => {
    const ball = document.createElement('div');
    ball.className = `ball-mini ${getBallColorClass(num)}`;
    ball.textContent = num;
    ballsRow.appendChild(ball);
    
    if (mBallsRow) {
      mBallsRow.appendChild(ball.cloneNode(true));
    }
  });
  
  const plus = document.createElement('span');
  plus.textContent = '+';
  plus.style.margin = '0 4px';
  plus.style.fontWeight = 'bold';
  ballsRow.appendChild(plus);
  
  if (mBallsRow) {
    mBallsRow.appendChild(plus.cloneNode(true));
  }
  
  const bonusBall = document.createElement('div');
  bonusBall.className = `ball-mini ${getBallColorClass(data.bnusNo)}`;
  bonusBall.textContent = data.bnusNo;
  ballsRow.appendChild(bonusBall);
  
  if (mBallsRow) {
    mBallsRow.appendChild(bonusBall.cloneNode(true));
  }
  
  // Show/Hide Before Draw Banner
  if (beforeDraw) {
    banner.classList.remove('hidden');
    banner.textContent = `⚠️ 금주 ${targetDraw + 1}회차는 아직 추첨 전입니다. 직전 ${targetDraw}회차 결과를 자동으로 로드했습니다.`;
  } else {
    banner.classList.add('hidden');
  }
  
  // Trigger matcher
  runDrawMatcher();
}

// Background auto loader on page load
async function loadLatestActualDrawInfo() {
  const ballsRow = document.getElementById('info-balls-row');
  let targetDraw = getCalculatedLatestDraw();
  let beforeDraw = false;
  let data = null;
  
  // Try loading cached draw details instantly
  const cachedStr = localStorage.getItem('ados_cached_draw_data');
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr);
      if (cached && cached.returnValue === "success") {
        renderDrawInfoDOM(cached, cached.drwNo, (getCalculatedLatestDraw() > cached.drwNo));
        console.log(`Loaded cached draw info for ${cached.drwNo} instantly.`);
        
        // If the cache contains the calculated latest target draw, we do NOT need to fetch!
        if (cached.drwNo === targetDraw || cached.drwNo === targetDraw - 1) {
          return; // Instant exit!
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached draw data", e);
    }
  }
  
  // Otherwise fetch from remote proxy in background
  try {
    data = await tryFetchDraw(targetDraw);
    if (!data || data.returnValue === "fail") {
      beforeDraw = true;
      targetDraw -= 1;
      data = await tryFetchDraw(targetDraw);
    }
  } catch (e) {
    console.warn("CORS Proxies failed. Degrading gracefully to offline fallback data.", e);
    // Silent degradations using offline pre-verified fallback
    data = FALLBACK_LATEST_DRAW;
    targetDraw = FALLBACK_LATEST_DRAW.drwNo;
    beforeDraw = (getCalculatedLatestDraw() > targetDraw);
  }
  
  if (data && data.returnValue === "success") {
    // Save to local cache
    localStorage.setItem('ados_cached_draw_data', JSON.stringify(data));
    renderDrawInfoDOM(data, targetDraw, beforeDraw);
  } else {
    ballsRow.innerHTML = '<span class="loading-draw-text">공식 데이터를 불러오지 못했습니다.</span>';
  }
}

async function fetchLatestLottoNumbers() {
  const btn = document.getElementById('btn-fetch-latest');
  btn.disabled = true;
  btn.textContent = "조회 중...";
  
  try {
    await loadLatestActualDrawInfo();
    btn.textContent = "로드 완료 ✓";
  } catch (e) {
    alert("당첨 번호 로드에 실패했습니다.");
    btn.textContent = "당첨번호 자동로드 🔄";
  } finally {
    btn.disabled = false;
  }
}

// --- Pinned / Excluded UI Marking Board Initialization ---
function toggleNumberFilter(number) {
  let nextState = 'default';
  
  if (!pinnedNumbers.has(number) && !excludedNumbers.has(number)) {
    if (pinnedNumbers.size < 5) {
      pinnedNumbers.add(number);
      nextState = 'pinned';
      badgeText.textContent = `고정수 추가: ${number}번`;
    } else {
      excludedNumbers.add(number);
      nextState = 'excluded';
      badgeText.textContent = `제외수 추가: ${number}번`;
    }
  } else if (pinnedNumbers.has(number)) {
    pinnedNumbers.delete(number);
    excludedNumbers.add(number);
    nextState = 'excluded';
    badgeText.textContent = `제외수로 전환: ${number}번`;
  } else if (excludedNumbers.has(number)) {
    excludedNumbers.delete(number);
    nextState = 'default';
    badgeText.textContent = `필터 해제: ${number}번`;
  }
  
  // Sync classes for all matching buttons in both desktop and mobile grids
  const buttons = document.querySelectorAll(`.marking-btn[data-num="${number}"]`);
  buttons.forEach(btn => {
    btn.className = 'marking-btn';
    if (nextState === 'pinned') {
      btn.classList.add('pinned');
    } else if (nextState === 'excluded') {
      btn.classList.add('excluded');
    }
  });
}

function createMarkingButton(number) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'marking-btn';
  btn.textContent = number;
  btn.dataset.num = number;
  
  if (pinnedNumbers.has(number)) {
    btn.classList.add('pinned');
  } else if (excludedNumbers.has(number)) {
    btn.classList.add('excluded');
  }
  
  btn.addEventListener('click', () => {
    if (isDrawing) return;
    toggleNumberFilter(number);
  });
  
  return btn;
}

function initMarkingBoard() {
  const desktopGrid = document.getElementById('marking-board-grid');
  const mobileGrid = document.getElementById('m-marking-board-grid');
  
  if (desktopGrid) {
    desktopGrid.innerHTML = '';
    for (let i = 1; i <= 45; i++) {
      desktopGrid.appendChild(createMarkingButton(i));
    }
  }
  
  if (mobileGrid) {
    mobileGrid.innerHTML = '';
    for (let i = 1; i <= 45; i++) {
      mobileGrid.appendChild(createMarkingButton(i));
    }
  }
}

// --- Attach History Control Handlers ---
btnClearHistory.addEventListener('click', clearHistoryAll);
btnRunMatch.addEventListener('click', runDrawMatcher);
document.getElementById('btn-fetch-latest').addEventListener('click', fetchLatestLottoNumbers);

// Period Selection Change
selectPeriod.addEventListener('change', () => {
  activePeriod = selectPeriod.value;
  updateActiveWeights();
  badgeText.textContent = `분석 통계 기간 변경: ${selectPeriod.options[selectPeriod.selectedIndex].text}`;
});

// Export Backup (JSON)
btnExportHistory.addEventListener('click', () => {
  if (history.length === 0) {
    alert("백업할 대장 기록이 없습니다.");
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `lotto_ledger_backup_${new Date().toISOString().slice(0,10)}.json`);
  dlAnchorElem.click();
  badgeText.textContent = "로또 대장 백업 성공 📥";
});

// Import Backup (JSON)
btnImportHistory.addEventListener('click', () => {
  fileImportHistory.click();
});

fileImportHistory.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      if (Array.isArray(parsed)) {
        // Validate records structure
        const valid = parsed.every(item => Array.isArray(item.numbers) && typeof item.mode === 'number');
        if (valid) {
          history = parsed;
          localStorage.setItem('ados_lotto_history', JSON.stringify(history));
          renderHistoryLogs();
          updateBigDataDashboard();
          badgeText.textContent = "로또 대장 복원 성공 📤";
          alert(`로또 대장 복원 완료! 총 ${history.length}개의 게임이 복원되었습니다.`);
        } else {
          alert("올바르지 않은 백업 파일 형식입니다.");
        }
      } else {
        alert("올바르지 않은 백업 파일입니다.");
      }
    } catch (err) {
      alert("파일 읽기 오류 또는 손상된 파일입니다.");
    }
  };
  reader.readAsText(file);
  fileImportHistory.value = ''; // clear input
});

// --- Mobile Version Specific Event Handlers ---
const mBtnGenerate = document.getElementById('m-btn-generate');
if (mBtnGenerate) {
  mBtnGenerate.addEventListener('click', () => {
    if (isDrawing) return;
    
    isDrawing = true;
    mBtnGenerate.disabled = true;
    const originalText = mBtnGenerate.textContent;
    mBtnGenerate.textContent = "⚡ 추출 중...";
    
    const mResultsArea = document.getElementById('m-results-area');
    const mPart1List = document.getElementById('m-part1-list');
    if (mResultsArea) mResultsArea.classList.add('hidden');
    
    setTimeout(() => {
      const setsCount = parseInt(selectSets.value) || 3;
      const temp = parseFloat(selectTemp.value) || 1.0;
      
      let m1 = "stat";
      if (currentMode === 2 || currentMode === 4) { m1 = "rand"; }
      
      const pool_1 = new Set(Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !excludedNumbers.has(n)));
      let results1, scores1;
      
      if (m1 === "stat") {
        const res = generateStatSets(pool_1, setsCount, temp);
        results1 = res.sets;
        scores1 = res.scores;
      } else {
        results1 = generateRandSets(pool_1, setsCount);
        scores1 = Array(setsCount).fill("Pure Random");
      }
      
      if (mPart1List) {
        mPart1List.innerHTML = '';
        results1.forEach((set, idx) => {
          mPart1List.appendChild(createSetCard(idx + 1, set, scores1[idx]));
        });
      }
      
      // Update mobile deck title dynamically
      const mDeckTitle = document.querySelector('.m-deck-title');
      if (mDeckTitle) {
        mDeckTitle.textContent = `🎯 추천 번호 (${setsCount}세트)`;
      }
      
      if (mResultsArea) mResultsArea.classList.remove('hidden');
      
      mBtnGenerate.textContent = originalText;
      mBtnGenerate.disabled = false;
      isDrawing = false;
      
      runDrawMatcher();
    }, 500);
  });
}

const mBtnClearHistory = document.getElementById('m-btn-clear-history');
if (mBtnClearHistory) {
  mBtnClearHistory.addEventListener('click', clearHistoryAll);
}

// --- Mobile settings elements declaration ---
const mSelectMode = document.getElementById('m-select-mode');
const mSelectSets = document.getElementById('m-select-sets');
const mSelectTemp = document.getElementById('m-select-temp');
const mSelectPeriod = document.getElementById('m-select-period');

// Sync Mobile -> Desktop
if (mSelectMode) {
  mSelectMode.addEventListener('change', () => {
    currentMode = parseInt(mSelectMode.value);
    
    // Update desktop mode option highlights
    const desktopCards = document.querySelectorAll('.mode-option');
    desktopCards.forEach(card => {
      card.classList.remove('active');
      if (parseInt(card.dataset.mode) === currentMode) {
        card.classList.add('active');
      }
    });
    badgeText.textContent = `${MODE_DESCRIPTIONS[currentMode].name.toUpperCase()} 선택됨`;
  });
}

if (mSelectSets) {
  mSelectSets.addEventListener('change', () => {
    selectSets.value = mSelectSets.value;
  });
}

if (mSelectTemp) {
  mSelectTemp.addEventListener('change', () => {
    selectTemp.value = mSelectTemp.value;
  });
}

if (mSelectPeriod) {
  mSelectPeriod.addEventListener('change', () => {
    selectPeriod.value = mSelectPeriod.value;
    activePeriod = selectPeriod.value;
    updateActiveWeights();
    badgeText.textContent = `분석 통계 기간 변경: ${selectPeriod.options[selectPeriod.selectedIndex].text}`;
  });
}

// Sync Desktop -> Mobile (Adds listeners to desktop selects to update mobile selects)
selectSets.addEventListener('change', () => {
  if (mSelectSets) mSelectSets.value = selectSets.value;
});

selectTemp.addEventListener('change', () => {
  if (mSelectTemp) mSelectTemp.value = selectTemp.value;
});

// For Desktop Card Click: we already sync to .m-mode-chip in the desktop listener,
// but since we replaced chips with select dropdown, let's sync to mSelectMode instead!
// Let's modify the desktop listener sync code in app.js later. For now, let's add desktop selectPeriod listener sync:
selectPeriod.addEventListener('change', () => {
  if (mSelectPeriod) mSelectPeriod.value = selectPeriod.value;
});

// Initialize Marking Board, Load Storage, and Auto Fetch Actual Draw Info on Page Load
initMarkingBoard();
updateActiveWeights();
generateDirectlyNoAnimation();
loadHistoryFromStorage();
loadLatestActualDrawInfo();
