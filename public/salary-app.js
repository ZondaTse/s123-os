// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════

const peopleApr = [
  {name:'孔敏怡',dept:'运营',may:5050,apr:0,type:'neu',reason:'底薪+补贴+全勤，无加班提成。',bars:[{n:'底薪',may:4900,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'伍华彩',dept:'美工',may:6910,apr:0,type:'neu',reason:'加班¥260（按1天折算）。',bars:[{n:'底薪',may:6500,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:260,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'赵姗姗',dept:'美工',may:7118,apr:0,type:'neu',reason:'加班¥268（按1天折算）。',bars:[{n:'底薪',may:6700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:268,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'赵佳琪',dept:'客服',may:5850,apr:0,type:'neu',reason:'产假期间，按固定标准发放。',bars:[{n:'底薪',may:5700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'莫翠玲',dept:'阳江客服',may:8200,apr:0,type:'neu',reason:'居家办公，固定薪资，无全勤。',bars:[{n:'底薪',may:8200,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'莫碧君',dept:'阳江客服',may:8200,apr:0,type:'neu',reason:'居家办公，固定薪资，无全勤。',bars:[{n:'底薪',may:8200,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'陈嘉仪',dept:'阳江客服',may:7422,apr:0,type:'neu',reason:'加班¥402（约1.5天），各项正常。',bars:[{n:'底薪',may:6700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:402,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'郭锋原',dept:'直播办公室',may:12790,apr:0,type:'neu',reason:'固定加班¥2,000已计入；GMV提成¥840已发。',bars:[{n:'底薪',may:9800,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:2000,apr:0},{n:'提成',may:840,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'黄东亮',dept:'直播办公室',may:7754,apr:0,type:'neu',reason:'GMV提成¥404已计入，本月无加班费。',bars:[{n:'底薪',may:7200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:404,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'伍尚康',dept:'直播办公室',may:9350,apr:0,type:'neu',reason:'底薪+补贴+全勤，本月无加班。',bars:[{n:'底薪',may:9200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'王靖允',dept:'直播办公室',may:5648,apr:0,type:'neu',reason:'扣请假¥620，有提成¥218，全勤未达标。',bars:[{n:'底薪',may:6200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:218,apr:0},{n:'请假扣',may:-620,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'杨欣',dept:'直播办公室',may:8121,apr:0,type:'neu',reason:'加班费¥674+提成¥127，本月收入较高。',bars:[{n:'底薪',may:7000,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:674,apr:0},{n:'提成',may:127,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'唐恺',dept:'直播办公室',may:5055,apr:0,type:'neu',reason:'扣请假¥347，有提成¥351，全勤未达标。',bars:[{n:'底薪',may:5200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:351,apr:0},{n:'请假扣',may:-347,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'胡可财',dept:'直播办公室',may:4147,apr:0,type:'neu',reason:'有提成¥127，各项正常。',bars:[{n:'底薪',may:3700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:127,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'许朝阳',dept:'直播办公室',may:6144,apr:0,type:'neu',reason:'加班费¥500+提成¥294，本月表现好。',bars:[{n:'底薪',may:5200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:500,apr:0},{n:'提成',may:294,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'张妍柔',dept:'直播办公室',may:7520,apr:0,type:'neu',reason:'底薪+补贴+全勤，无加班提成。',bars:[{n:'底薪',may:7200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'林汝荣',dept:'剪辑号',may:9350,apr:0,type:'neu',reason:'固定加班费¥3,000，各项正常。',bars:[{n:'底薪',may:6200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:3000,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'项柯桥',dept:'剪辑号',may:5558,apr:0,type:'neu',reason:'加班费¥208（约10.4小时）。',bars:[{n:'底薪',may:5200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:208,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'黄龙光',dept:'剪辑号',may:3950,apr:0,type:'neu',reason:'按固定标准发放。',bars:[{n:'底薪',may:4600,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'谢克卓',dept:'陈先生项目',may:5558,apr:0,type:'neu',reason:'加班费¥208（约10.4小时）。',bars:[{n:'底薪',may:5200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:208,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'林健欢',dept:'陈先生项目',may:7350,apr:0,type:'neu',reason:'底薪+补贴+全勤，各项正常。',bars:[{n:'底薪',may:7200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'陈奕友',dept:'陈先生项目',may:5350,apr:0,type:'neu',reason:'固定工资¥5,350。',bars:[{n:'底薪',may:6000,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'梁梦娜',dept:'陈先生项目',may:7000,apr:0,type:'neu',reason:'固定工资¥7,000（含一切）。',bars:[{n:'固定总额',may:7000,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'肖煌',dept:'仓库',may:7690,apr:0,type:'neu',reason:'固定加班¥1,000已计入；罚款¥10。',bars:[{n:'底薪',may:7200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:1000,apr:0},{n:'提成',may:0,apr:0},{n:'罚款',may:-10,apr:0},{n:'社保',may:-1300,apr:0}]},
  {name:'梁想贤',dept:'仓库',may:6128,apr:0,type:'neu',reason:'绩效提成¥1,670，加班¥168；罚款¥10。',bars:[{n:'底薪',may:4200,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:168,apr:0},{n:'提成',may:1670,apr:0},{n:'罚款',may:-10,apr:0},{n:'社保',may:-700,apr:0}]},
  {name:'梁苑斌',dept:'仓库',may:7212,apr:0,type:'neu',reason:'绩效提成¥4,262，加班¥160；罚款¥10。',bars:[{n:'底薪',may:2700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:160,apr:0},{n:'提成',may:4262,apr:0},{n:'罚款',may:-10,apr:0},{n:'社保',may:-700,apr:0}]},
  {name:'何均伟',dept:'仓库',may:7137,apr:0,type:'neu',reason:'绩效提成¥3,817，加班¥300。',bars:[{n:'底薪',may:2700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:300,apr:0},{n:'提成',may:3817,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'黄扬明',dept:'仓库',may:5979,apr:0,type:'neu',reason:'绩效提成¥3,179，底薪按出勤23.5天折算；罚款¥10。',bars:[{n:'底薪',may:3290,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:3179,apr:0},{n:'罚款',may:-10,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'林庆霞',dept:'仓库',may:5308,apr:0,type:'neu',reason:'绩效提成¥2,158，加班¥200，底薪按出勤22.5天折算；罚款¥20。',bars:[{n:'底薪',may:3150,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:200,apr:0},{n:'提成',may:2158,apr:0},{n:'罚款',may:-20,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'金丽桃',dept:'仓库',may:5898,apr:0,type:'neu',reason:'绩效提成¥2,948，加班¥360，底薪按出勤22天折算；罚款¥10。',bars:[{n:'底薪',may:3080,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:360,apr:0},{n:'提成',may:2948,apr:0},{n:'罚款',may:-10,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'庞金茹',dept:'仓库',may:5405,apr:0,type:'neu',reason:'绩效提成¥2,395，加班¥360，底薪按出勤22.5天折算；罚款¥20。',bars:[{n:'底薪',may:3150,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:360,apr:0},{n:'提成',may:2395,apr:0},{n:'罚款',may:-20,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'陈招汉',dept:'仓库',may:6565,apr:0,type:'neu',reason:'绩效提成¥3,745，加班¥300，底薪按出勤23天折算。',bars:[{n:'底薪',may:3220,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:300,apr:0},{n:'提成',may:3745,apr:0},{n:'社保',may:-700,apr:0}]},
  {name:'庞智鹏',dept:'仓库',may:4586,apr:0,type:'neu',reason:'绩效提成¥1,886，加班¥100，底薪按出勤22天折算。',bars:[{n:'底薪',may:3080,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:100,apr:0},{n:'提成',may:1886,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'董金源',dept:'仓库',may:4879,apr:0,type:'neu',reason:'绩效提成¥2,939，加班¥40，底薪按出勤17天折算。',bars:[{n:'底薪',may:2380,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:40,apr:0},{n:'提成',may:2939,apr:0},{n:'社保',may:-480,apr:0}]},
  {name:'莫智雄',dept:'仓库',may:5850,apr:0,type:'neu',reason:'底薪+补贴+全勤，本月无加班提成。',bars:[{n:'底薪',may:5700,apr:0},{n:'补贴',may:500,apr:0},{n:'全勤',may:300,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'梁启凡',dept:'仓库',may:5350,apr:0,type:'neu',reason:'固定工资¥5,350。',bars:[{n:'底薪',may:6000,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:0}]},
  {name:'梁丽云',dept:'售后',may:5210,apr:0,type:'neu',reason:'绩效提成¥2,086，加班¥40。',bars:[{n:'底薪',may:3784,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:40,apr:0},{n:'提成',may:2086,apr:0},{n:'社保',may:-700,apr:0}]},
  {name:'胡海云',dept:'售后',may:4727,apr:0,type:'neu',reason:'绩效提成¥1,787；底薪按出勤折算。',bars:[{n:'底薪',may:2940,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:1787,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'陈仲竹',dept:'售后',may:5721,apr:0,type:'neu',reason:'绩效提成¥2,521，加班¥120（6小时）。',bars:[{n:'底薪',may:3080,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:120,apr:0},{n:'提成',may:2521,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'吴美',dept:'售后',may:5147,apr:0,type:'neu',reason:'绩效提成¥1,687，加班¥110，社保补贴+200。',bars:[{n:'底薪',may:3150,apr:0},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:110,apr:0},{n:'提成',may:1687,apr:0},{n:'其他',may:200,apr:0},{n:'社保',may:0,apr:0}]},
];

const peopleMay = [
  {name:'孔敏怡',dept:'运营',may:5050,apr:5050,type:'neu',reason:'底薪+补贴+全勤，与上月完全一致。',bars:[{n:'底薪',may:4900,apr:4900},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'伍华彩',dept:'美工',may:6700,apr:6910,type:'dn',reason:'上月加班按1天折算¥260，本月改按实际小时，2.5小时仅¥50，差额¥210。',bars:[{n:'底薪',may:6500,apr:6500},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:50,apr:260},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'赵姗姗',dept:'美工',may:6970,apr:7118,type:'dn',reason:'上月加班按1天折算¥268，本月改按小时，6小时计¥120，差额¥148。',bars:[{n:'底薪',may:6700,apr:6700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:120,apr:268},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'赵佳琪',dept:'客服',may:5850,apr:5850,type:'neu',reason:'产假期间，按固定标准发放。',bars:[{n:'底薪',may:5700,apr:5700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'莫翠玲',dept:'阳江客服',may:8200,apr:8200,type:'neu',reason:'居家办公，固定薪资，无全勤奖。',bars:[{n:'底薪',may:8200,apr:8200},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'莫碧君',dept:'阳江客服',may:8200,apr:8200,type:'neu',reason:'居家办公，固定薪资，无全勤奖。',bars:[{n:'底薪',may:8200,apr:8200},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'陈嘉仪',dept:'阳江客服',may:7020,apr:7422,type:'dn',reason:'上月有1.5天加班费¥402，本月加班仅0.5小时未计入，差额¥402。',bars:[{n:'底薪',may:6700,apr:6700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:0,apr:402},{n:'提成',may:0,apr:0},{n:'社保',may:-480,apr:-480}]},
  {name:'郭锋原',dept:'直播办公室',may:11950,apr:12790,type:'warn',reason:'GMV提成待确认暂未计入，固定加班费¥2,000已计入；上月有提成¥840。',pending:'⚠ GMV提成确认后补入，补入后总额将高于上月。',bars:[{n:'底薪',may:9800,apr:9800},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:2000,apr:2000},{n:'提成',may:0,apr:840},{n:'社保',may:-650,apr:-650}]},
  {name:'黄东亮',dept:'直播办公室',may:7470,apr:7754,type:'warn',reason:'上月有提成¥404，本月GMV提成待补；加班费¥120已计入。',pending:'⚠ GMV提成确认后补入。',bars:[{n:'底薪',may:7200,apr:7200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:120,apr:0},{n:'提成',may:0,apr:404},{n:'社保',may:-650,apr:-650}]},
  {name:'伍尚康',dept:'直播办公室',may:9350,apr:9350,type:'neu',reason:'底薪+补贴+全勤，与上月一致，本月未排班。',bars:[{n:'底薪',may:9200,apr:9200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'王靖允',dept:'直播办公室',may:6750,apr:5648,type:'up',reason:'上月扣¥620请假，本月不扣；本月加班20小时，加班费¥400，合计涨¥1,102。',bars:[{n:'底薪',may:6200,apr:6200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:400,apr:0},{n:'提成',may:0,apr:218},{n:'社保',may:-650,apr:-650}]},
  {name:'杨欣',dept:'直播办公室',may:7380,apr:8121,type:'warn',reason:'上月有提成¥127+加班¥674，本月加班费¥60，GMV提成待补。',pending:'⚠ GMV提成确认后补入。',bars:[{n:'底薪',may:7000,apr:7000},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:60,apr:674},{n:'提成',may:0,apr:127},{n:'社保',may:-480,apr:-480}]},
  {name:'唐恺',dept:'直播办公室',may:5380,apr:5055,type:'up',reason:'上月扣¥347请假，本月不扣；加班费¥30。',bars:[{n:'底薪',may:5200,apr:5200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:0},{n:'加班',may:30,apr:0},{n:'提成',may:0,apr:351},{n:'社保',may:-650,apr:-650}]},
  {name:'胡可财',dept:'直播办公室',may:4120,apr:4147,type:'dn',reason:'与上月基本持平，上月有少量提成¥127，本月未计，差额¥27。',bars:[{n:'底薪',may:3700,apr:3700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:100,apr:0},{n:'提成',may:0,apr:127},{n:'社保',may:-480,apr:-480}]},
  {name:'许朝阳',dept:'直播办公室',may:5610,apr:6144,type:'warn',reason:'上月有提成¥294+加班¥500，本月加班费¥260，GMV提成待补。',pending:'⚠ GMV提成确认后补入。',bars:[{n:'底薪',may:5200,apr:5200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:260,apr:500},{n:'提成',may:0,apr:294},{n:'社保',may:-650,apr:-650}]},
  {name:'张妍柔',dept:'直播办公室',may:7580,apr:7520,type:'up',reason:'本月加班3小时，加班费¥60，微涨。',bars:[{n:'底薪',may:7200,apr:7200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:60,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-480,apr:-480}]},
  {name:'林汝荣',dept:'剪辑号',may:9350,apr:9350,type:'neu',reason:'固定加班费¥3,000，与上月完全一致。',bars:[{n:'底薪',may:6200,apr:6200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:3000,apr:3000},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'项柯桥',dept:'剪辑号',may:6440,apr:5558,type:'up',reason:'本月飞书加班54.5小时，按20元/小时计加班费¥1,090，上月无加班费。',bars:[{n:'底薪',may:5200,apr:5200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:1090,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'黄龙光',dept:'剪辑号',may:3950,apr:3950,type:'neu',reason:'按上月标准固定发放。',bars:[{n:'底薪',may:4600,apr:4600},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'谢克卓',dept:'陈先生项目',may:6400,apr:5558,type:'up',reason:'本月加班52.5小时，加班费¥1,050，上月仅加班费¥208。',bars:[{n:'底薪',may:5200,apr:5200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:1050,apr:208},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'林健欢',dept:'陈先生项目',may:7880,apr:7350,type:'up',reason:'本月加班26.5小时，加班费¥530，上月无加班费。',bars:[{n:'底薪',may:7200,apr:7200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:530,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'陈奕友',dept:'陈先生项目',may:5350,apr:5350,type:'neu',reason:'固定工资，与上月一致。',bars:[{n:'底薪',may:6000,apr:6000},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'梁梦娜',dept:'陈先生项目',may:7000,apr:6000,type:'up',reason:'原"娜娜"，本月起固定¥7,000，上月为底薪+全勤等合计¥6,000。',bars:[{n:'固定总额',may:7000,apr:6000},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:0,apr:0}]},
  {name:'肖煌',dept:'仓库',may:7700,apr:7690,type:'warn',reason:'固定加班费¥1,000已计入；仓库绩效提成暂未补入，待主管确认。',pending:'⚠ 仓库绩效提成待确认后补入。',bars:[{n:'底薪',may:7200,apr:7200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:1000,apr:1000},{n:'提成',may:0,apr:0},{n:'社保',may:-1300,apr:-1300}]},
  {name:'梁想贤',dept:'仓库',may:6190,apr:6128,type:'up',reason:'绩效提成¥1,670，加班费¥220，与上月基本持平。',bars:[{n:'底薪',may:4200,apr:4200},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:220,apr:168},{n:'提成',may:1670,apr:1670},{n:'社保',may:-700,apr:-700}]},
  {name:'梁苑斌',dept:'仓库',may:7252,apr:7212,type:'up',reason:'绩效提成¥4,262，加班费¥190，与上月基本持平。',bars:[{n:'底薪',may:2700,apr:2700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:190,apr:160},{n:'提成',may:4262,apr:4262},{n:'社保',may:-700,apr:-700}]},
  {name:'何均伟',dept:'仓库',may:7087,apr:7137,type:'dn',reason:'绩效提成¥3,817与上月一致；上月加班¥300，本月加班¥250，微降¥50。',bars:[{n:'底薪',may:2700,apr:2700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:250,apr:300},{n:'提成',may:3817,apr:3817},{n:'社保',may:-480,apr:-480}]},
  {name:'黄扬明',dept:'仓库',may:6419,apr:5979,type:'up',reason:'本月底薪按满月计算，上月按出勤23.5天折算偏低；加班费¥130。',bars:[{n:'底薪',may:3290,apr:3080},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:130,apr:0},{n:'提成',may:3179,apr:3179},{n:'社保',may:-480,apr:-480}]},
  {name:'林庆霞',dept:'仓库',may:5308,apr:5008,type:'up',reason:'绩效提成¥2,158，加班费¥180；上月底薪按出勤天数折算偏低。',bars:[{n:'底薪',may:3150,apr:3150},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:180,apr:200},{n:'提成',may:2158,apr:2158},{n:'社保',may:-480,apr:-480}]},
  {name:'金丽桃',dept:'仓库',may:6018,apr:5898,type:'up',reason:'绩效提成¥2,948，加班费¥170；上月底薪按出勤22天折算偏低。',bars:[{n:'底薪',may:3080,apr:3080},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:170,apr:360},{n:'提成',may:2948,apr:2948},{n:'社保',may:-480,apr:-480}]},
  {name:'庞金茹',dept:'仓库',may:5615,apr:5405,type:'up',reason:'绩效提成¥2,395，加班费¥250；上月底薪按出勤天数折算偏低。',bars:[{n:'底薪',may:3150,apr:3150},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:250,apr:360},{n:'提成',may:2395,apr:2395},{n:'社保',may:-480,apr:-480}]},
  {name:'陈招汉',dept:'仓库',may:6615,apr:6565,type:'up',reason:'绩效提成¥3,745，本月加班¥50，与上月基本持平。',bars:[{n:'底薪',may:3220,apr:3220},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:50,apr:300},{n:'提成',may:3745,apr:3745},{n:'社保',may:-700,apr:-700}]},
  {name:'庞智鹏',dept:'仓库',may:4956,apr:4586,type:'up',reason:'绩效提成¥1,886，加班费¥170；上月底薪按出勤22天折算偏低。',bars:[{n:'底薪',may:3080,apr:3080},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:170,apr:100},{n:'提成',may:1886,apr:1886},{n:'社保',may:-480,apr:-480}]},
  {name:'董金源',dept:'仓库',may:5199,apr:4879,type:'up',reason:'绩效提成¥2,939，加班费¥60；上月底薪按出勤17天折算偏低，本月满月计算。',bars:[{n:'底薪',may:2380,apr:2380},{n:'补贴',may:0,apr:0},{n:'全勤',may:300,apr:300},{n:'加班',may:60,apr:40},{n:'提成',may:2939,apr:2939},{n:'社保',may:-480,apr:-480}]},
  {name:'莫智雄',dept:'仓库',may:5870,apr:5850,type:'warn',reason:'底薪+加班¥20已计入；仓库绩效提成暂未计入。',pending:'⚠ 仓库绩效提成待确认后补入。',bars:[{n:'底薪',may:5700,apr:5700},{n:'补贴',may:500,apr:500},{n:'全勤',may:300,apr:300},{n:'加班',may:20,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'梁启凡',dept:'仓库',may:5350,apr:5350,type:'neu',reason:'固定工资，与上月一致。',bars:[{n:'底薪',may:6000,apr:6000},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:0,apr:0},{n:'提成',may:0,apr:0},{n:'社保',may:-650,apr:-650}]},
  {name:'梁丽云',dept:'售后',may:5600,apr:5210,type:'up',reason:'本月加班21.5小时，加班费¥430；绩效提成¥2,086。',bars:[{n:'底薪',may:3784,apr:3784},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:430,apr:40},{n:'提成',may:2086,apr:2086},{n:'社保',may:-700,apr:-700}]},
  {name:'胡海云',dept:'售后',may:5297,apr:4727,type:'up',reason:'绩效提成¥1,787，加班0.5小时计¥10；上月底薪按出勤折算偏低。',bars:[{n:'底薪',may:3500,apr:2940},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:10,apr:0},{n:'提成',may:1787,apr:1787},{n:'社保',may:0,apr:0}]},
  {name:'陈仲竹',dept:'售后',may:7281,apr:5721,type:'up',reason:'加班63小时加班费¥1,260 + 绩效提成¥2,521，涨幅较大，主管确认中。',pending:'⚠ 加班63小时涨幅较大，需主管确认是否属实。',bars:[{n:'底薪',may:3500,apr:3500},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:1260,apr:120},{n:'提成',may:2521,apr:2521},{n:'社保',may:0,apr:0}]},
  {name:'吴美',dept:'售后',may:5907,apr:5147,type:'up',reason:'本月加班36小时，加班费¥720；绩效提成¥1,687。',bars:[{n:'底薪',may:3500,apr:3500},{n:'补贴',may:0,apr:0},{n:'全勤',may:0,apr:0},{n:'加班',may:720,apr:0},{n:'提成',may:1687,apr:1687},{n:'社保',may:0,apr:0}]},
];

// Monthly metadata — add new months here as data becomes available
const monthMeta = {
  4: {
    people: peopleApr,
    total: 257887,
    prevTotal: null,   // no March data
    label: '4月',
    summary: '4月实发总额 <span style="color:var(--sal-green);font-weight:600;">¥257,887</span>，共40人。直播组多人有GMV提成及加班费计入，仓库绩效正常发放。王靖允/唐恺有请假扣款；郭锋原固定加班¥2,000+提成¥840。',
    pendingTitle: '📌 4月备注',
    pendingBody: '郭锋原 — 固定加班¥2,000 + GMV提成¥840 已计入<br>王靖允 / 唐恺 — 有请假扣款<br>仓库绩效已计入各人4月提成',
  },
  5: {
    people: peopleMay,
    total: 263614,
    prevTotal: 257887,
    label: '5月',
    summary: '5月总工资较4月增加 <span style="color:var(--sal-red);font-weight:600;">¥5,727（+2.2%）</span>，主要来自仓库及直播组加班费普遍计入。郭锋原/杨欣/许朝阳/黄东亮 GMV提成待补，补完后总额将进一步上涨。',
    pendingTitle: '⚠ 以下人员补充后总额将继续上调',
    pendingBody: '郭锋原 / 杨欣 / 许朝阳 / 黄东亮 — GMV提成待确认<br>肖煌 / 莫智雄 — 仓库绩效待确认<br>陈仲竹 — 加班63小时待主管确认',
  },
};

const AVAILABLE_MONTHS = [4, 5];  // ← 每月追加这里

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let currentMonth = 5;   // default to latest
let currentFilter = 'all';

// ═══════════════════════════════════════════
// STATIC MAPS
// ═══════════════════════════════════════════
function Sal_fmt(n){ return Math.abs(n).toLocaleString('zh-CN'); }

const deptBg = {
  '运营':'bg-lavender','美工':'bg-sage','客服':'bg-sky','阳江客服':'bg-sand',
  '直播办公室':'bg-sky','剪辑号':'bg-lilac','陈先生项目':'bg-mint','仓库':'bg-stone','售后':'bg-ice',
};
const deptGroup = {
  '运营':'THEONE','美工':'THEONE','客服':'THEONE','阳江客服':'THEONE',
  '直播办公室':'直播','剪辑号':'剪辑号','陈先生项目':'陈先生','仓库':'仓库','售后':'售后',
};
const groupLabels = {
  'THEONE':'THEONE — 运营/美工/客服/阳江客服','直播':'直播办公室',
  '剪辑号':'剪辑号','陈先生':'陈先生项目','仓库':'仓库','售后':'售后',
};
const groupOrder = ['THEONE','直播','剪辑号','陈先生','仓库','售后'];

const deptOrder = ['孔敏怡','伍华彩','赵姗姗','赵佳琪','莫翠玲','莫碧君','陈嘉仪',
  '郭锋原','黄东亮','伍尚康','王靖允','杨欣','唐恺','胡可财','许朝阳','张妍柔',
  '林汝荣','项柯桥','黄龙光','谢克卓','林健欢','陈奕友','梁梦娜',
  '肖煌','梁想贤','梁苑斌','何均伟','黄扬明','林庆霞','金丽桃','庞金茹','陈招汉','庞智鹏','董金源','莫智雄','梁启凡',
  '梁丽云','胡海云','陈仲竹','吴美'];

const bannerBgMap = {
  'bg-lavender':'var(--sal-banner-lavender)','bg-sage':'var(--sal-banner-sage)','bg-sky':'var(--sal-banner-sky)','bg-sand':'var(--sal-banner-sand)',
  'bg-lilac':'var(--sal-banner-lilac)','bg-mint':'var(--sal-banner-mint)','bg-stone':'var(--sal-banner-stone)','bg-ice':'var(--sal-banner-ice)'
};
const bannerBorderMap = {
  'bg-lavender':'var(--sal-border-lavender)','bg-sage':'var(--sal-border-sage)','bg-sky':'var(--sal-border-sky)','bg-sand':'var(--sal-border-sand)',
  'bg-lilac':'var(--sal-border-lilac)','bg-mint':'var(--sal-border-mint)','bg-stone':'var(--sal-border-stone)','bg-ice':'var(--sal-border-ice)'
};

// ═══════════════════════════════════════════
// MONTH SWITCHING
// ═══════════════════════════════════════════
function Sal_switchMonth(m) {
  currentMonth = m;
  currentFilter = 'all';
  Sal_renderMonthNav();
  Sal_renderKPI();
  Sal_renderSummary();
  Sal_renderCards('all');
  // reset filter tabs
  document.querySelectorAll('.tab').forEach((t,i) => {
    t.classList.toggle('active', i===0);
  });
}

function Sal_renderMonthNav() {
  const nav = document.getElementById('sal-month-nav');
  nav.innerHTML = '';
  const calBtn = document.createElement('button');
  calBtn.className = 'month-chip';
  calBtn.style.cssText = 'background:var(--sal-fg);color:var(--sal-bg);padding:7px 14px;font-size:16px;';
  calBtn.textContent = '📅';
  calBtn.onclick = openCalendar;
  nav.appendChild(calBtn);

  AVAILABLE_MONTHS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'month-chip' + (m === currentMonth ? ' active' : '');
    btn.textContent = m + '月';
    btn.onclick = () => Sal_switchMonth(m);
    nav.appendChild(btn);
  });
}

// ═══════════════════════════════════════════
// KPI ROW
// ═══════════════════════════════════════════
function Sal_renderKPI() {
  const meta = monthMeta[currentMonth];
  const prev = meta.prevTotal;
  const curr = meta.total;
  const diff = prev != null ? curr - prev : null;
  const pct  = prev != null ? ((diff/prev)*100).toFixed(1) : null;
  const isUp = diff != null && diff > 0;
  const isDn = diff != null && diff < 0;
  const accentColor = isUp ? 'var(--sal-red)' : isDn ? 'var(--sal-green)' : 'var(--sal-blue2)';
  const accentBg    = isUp ? 'var(--sal-tint-red)' : isDn ? 'var(--sal-tint-green)' : 'var(--sal-tint-blue)';

  let kpiHtml = '';
  // Cell 1: prev month total (clickable)
  if (prev != null) {
    kpiHtml += `
    <div class="kpi" style="background:var(--sal-kpi-prev-bg)" onclick="Sal_openCalendar()">
      <div class="kpi-label" style="color:var(--sal-kpi-prev-fg)">上月总额</div>
      <div class="kpi-val" style="color:var(--sal-kpi-prev-fg)">¥${prev.toLocaleString('zh-CN')}</div>
      <div class="kpi-tap-hint">查看全年 ›</div>
    </div>`;
  } else {
    kpiHtml += `
    <div class="kpi" style="background:var(--sal-bg3);opacity:0.6" onclick="Sal_openCalendar()">
      <div class="kpi-label">上月总额</div>
      <div class="kpi-val" style="color:var(--sal-fg4)">—</div>
      <div class="kpi-tap-hint">查看全年 ›</div>
    </div>`;
  }
  // Cell 2: this month total (clickable)
  kpiHtml += `
    <div class="kpi" style="background:${accentBg}" onclick="Sal_openCalendar()">
      <div class="kpi-label" style="color:${accentColor}">本月总额</div>
      <div class="kpi-val" style="color:${accentColor}">¥${curr.toLocaleString('zh-CN')}</div>
      <div class="kpi-tap-hint" style="color:${accentColor};">查看全年 ›</div>
    </div>`;
  // Cell 3: MoM change or headcount
  if (diff != null) {
    const sign = diff>0?'+':diff<0?'':' ';
    kpiHtml += `
    <div class="kpi" style="background:${accentBg}">
      <div class="kpi-label" style="color:${accentColor}">环比增幅</div>
      <div style="font-size:13px;color:${accentColor};font-weight:600;margin-bottom:2px">${diff>=0?'+':''}¥${Math.abs(diff).toLocaleString('zh-CN')}</div>
      <div class="kpi-val" style="color:${accentColor}">${diff>=0?'+':''}${pct}%</div>
    </div>`;
  } else {
    kpiHtml += `
    <div class="kpi" style="background:#e8f2fb">
      <div class="kpi-label" style="color:#5b9fd6">人员数量</div>
      <div class="kpi-val" style="color:#5b9fd6">${meta.people.length}人</div>
    </div>`;
  }
  document.getElementById('sal-kpi-row').innerHTML = kpiHtml;
}

// ═══════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════
function Sal_renderSummary() {
  const meta = monthMeta[currentMonth];
  document.getElementById('sal-summary-title').textContent = meta.label + '概况';
  document.getElementById('sal-summary-text').innerHTML = meta.summary;
  // pending footer
  const fw = document.getElementById('sal-pending-footer-wrap');
  fw.innerHTML = meta.pendingBody ? `
    <div class="pending-footer">
      <div class="pending-footer-title">${meta.pendingTitle}</div>
      <div class="pending-footer-item">${meta.pendingBody}</div>
    </div>` : '';
}

// ═══════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════
function Sal_renderCards(filter) {
  currentFilter = filter;
  const people = monthMeta[currentMonth].people;
  const container = document.getElementById('sal-grid-container');
  container.innerHTML = '';
  const typeFilters = ['up','dn','neu','warn'];
  const isTypeFilter = typeFilters.includes(filter);
  let list = [...people].sort((a,b)=>deptOrder.indexOf(a.name)-deptOrder.indexOf(b.name));
  if(isTypeFilter){
    list = list.filter(p=>p.type===filter);
    const wrap = document.createElement('div');
    wrap.style.padding = '0 16px';
    const grid = document.createElement('div');
    grid.className = 'grid';
    list.forEach((p,i) => grid.appendChild(Sal_makeCard(p,i,list)));
    wrap.appendChild(grid);
    container.appendChild(wrap);
    return;
  }
  const groups = filter === 'all' ? groupOrder : [filter];
  groups.forEach(grp => {
    const grpList = list.filter(p=>deptGroup[p.dept]===grp);
    if(!grpList.length) return;
    const grpMay = grpList.reduce((s,p)=>s+p.may,0);
    const grpApr = grpList.reduce((s,p)=>s+p.apr,0);
    const hasGrpApr = grpApr > 0;
    const grpDiff = hasGrpApr ? grpMay - grpApr : null;
    const grpPct = hasGrpApr && grpApr>0 ? ((grpDiff/grpApr)*100).toFixed(1) : null;
    const grpBg = deptBg[grpList[0]?.dept] || '';
    const bannerBg = bannerBgMap[grpBg] || 'var(--sal-bg3)';
    const bannerBorder = bannerBorderMap[grpBg] || '#c7c7cc';
    const diffColor = grpDiff==null ? 'var(--sal-blue2)' : grpDiff>0?'var(--sal-red)':grpDiff<0?'var(--sal-green)':'var(--sal-blue2)';
    const aprColor = 'var(--sal-blue2)';
    const wrap = document.createElement('div');
    wrap.className = 'group-wrap';
    const hdr = document.createElement('div');
    hdr.className = 'group-tab';
    hdr.style.cssText = `background:${bannerBg};border-left:1px solid ${bannerBorder};border-right:1px solid ${bannerBorder};border-top:1px solid ${bannerBorder};`;
    const aprTxt = hasGrpApr ? `<span style="color:${aprColor}"><span class="group-banner-label">上月 </span>¥${grpApr.toLocaleString('zh-CN')}</span><span class="group-banner-arrow" style="margin:0 4px">→</span>` : '';
    const pctTxt = hasGrpApr && grpPct!=null ? `<span class="group-banner-diff" style="color:${diffColor}">(${grpDiff>=0?'+':''}${grpPct}%)</span>` : '';
    hdr.innerHTML = `
      <div class="group-banner-name">${groupLabels[grp]||grp}</div>
      <div class="group-banner-right">
        ${aprTxt}
        <span style="color:${diffColor}"><span class="group-banner-label">本月 </span>¥${grpMay.toLocaleString('zh-CN')}</span>
        ${pctTxt}
      </div>`;
    const body = document.createElement('div');
    body.className = 'group-body';
    body.style.cssText = `background:${bannerBg};border-left:1px solid ${bannerBorder};border-right:1px solid ${bannerBorder};border-bottom:1px solid ${bannerBorder};`;
    const sep = document.createElement('div');
    sep.style.cssText = `height:1px;background:${bannerBorder};margin-bottom:10px;`;
    body.appendChild(sep);
    const grid = document.createElement('div');
    grid.className = 'grid';
    grpList.forEach((p,i) => grid.appendChild(Sal_makeCard(p,i,grpList)));
    body.appendChild(grid);
    wrap.appendChild(hdr);
    wrap.appendChild(body);
    container.appendChild(wrap);
  });
}

function Sal_makeCard(p,i,list){
  const hasApr = p.apr > 0;
  const diff = hasApr ? p.may - p.apr : null;
  const sign = diff!=null ? (diff>0?'+':diff<0?'-':'') : '';
  const diffClass = diff==null ? 'diff-neu' : diff>0?'diff-up':diff<0?'diff-dn':'diff-neu';
  const diffDisplay = diff==null ? '—' : diff===0 ? '—' : `${sign}${Sal_fmt(diff)}`;
  const mayClass = diff==null ? 'may-neu' : diff>0?'may-up':diff<0?'may-dn':'may-neu';
  const warnDot = p.type==='warn'?'<span class="warn-dot"></span>':'';
  const bgClass = deptBg[p.dept]||'';
  const aprLine = hasApr ? `<div class="card-apr">上月 ¥${Sal_fmt(p.apr)}</div>` : '';
  const card = document.createElement('div');
  card.className = `card ${bgClass}`;
  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-name">${p.name}${warnDot}</div>
        <div class="card-dept-label">${p.dept}</div>
      </div>
      <div class="card-right">
        <div class="card-may ${mayClass}">¥${Sal_fmt(p.may)}</div>
        <div class="${diffClass}">${diffDisplay}</div>
        ${aprLine}
      </div>
    </div>
    <div class="card-reason">${p.reason}</div>`;
  card.addEventListener('click',()=>{
    card.classList.add('tapped');
    setTimeout(()=>card.classList.remove('tapped'),320);
    setTimeout(()=>Sal_openSheet(i,list),80);
  });
  return card;
}

function Sal_filterCards(f,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  Sal_renderCards(f);
}

// ═══════════════════════════════════════════
// PERSON DETAIL SHEET
// ═══════════════════════════════════════════
function Sal_openSheet(idx,list){
  const p = list[idx];
  const hasApr = p.apr > 0;
  const diff = hasApr ? p.may - p.apr : null;
  const bgClass = deptBg[p.dept]||'';
  const sheet = document.getElementById('sal-sheet');
  sheet.className = `sheet ${bgClass}`;
  document.getElementById('sal-d-name').textContent = p.name;

  // When no prev data: this-month cell is neutral blue, no tint on prev cell
  const mayBg    = diff==null ? 'var(--sal-tint-blue)' : diff>0?'var(--sal-tint-red)':diff<0?'var(--sal-tint-green)':'var(--sal-tint-blue)';
  const mayColor = diff==null ? 'var(--sal-blue2)'     : diff>0?'var(--sal-red)':diff<0?'var(--sal-green)':'var(--sal-blue2)';
  const pctVal   = hasApr ? ((diff/p.apr)*100).toFixed(1) : null;
  const aprDisplay = hasApr ? `¥${Sal_fmt(p.apr)}` : '—';

  document.getElementById('sal-d-compare').innerHTML = `
    <div class="sheet-kpi-row">
      <div class="sheet-kpi" style="background:var(--sal-kpi-prev-bg)">
        <div class="sheet-kpi-label" style="color:var(--sal-kpi-prev-fg)">上月实发</div>
        <div class="sheet-kpi-val" style="color:var(--sal-kpi-prev-fg)">${aprDisplay}</div>
      </div>
      <div class="sheet-kpi" style="background:${mayBg}">
        <div class="sheet-kpi-label" style="color:${mayColor}">本月实发</div>
        <div class="sheet-kpi-val" style="color:${mayColor}">¥${Sal_fmt(p.may)}</div>
      </div>
      <div class="sheet-kpi" style="background:var(--sal-bg3)">
        <div class="sheet-kpi-label" style="color:var(--sal-fg4)">环比</div>
        <div class="sheet-kpi-sub" style="color:var(--sal-fg4)">${hasApr?(diff>=0?'+':'')+`¥${Math.abs(diff).toLocaleString('zh-CN')}`:'—'}</div>
        <div class="sheet-kpi-val" style="color:var(--sal-fg4)">${hasApr?(diff>=0?'+':'')+Math.abs(pctVal)+'%':'—'}</div>
      </div>
    </div>`;

  document.getElementById('sal-d-diff').style.display='none';
  document.getElementById('sal-d-reason').textContent = p.reason;
  document.getElementById('sal-d-pending').innerHTML = p.pending?`<div class="pending-box">${p.pending}</div>`:'';
  const fmtRmb = v => v===0?'—':(v<0?`-¥${Sal_fmt(v)}`:`¥${Sal_fmt(v)}`);
  const activeBars = p.bars.filter(b=>!(b.may===0&&b.apr===0));
  let rows='';
  activeBars.forEach(b=>{
    // If no prev data at all for this month, just show this month value, no comparison
    if(!hasApr){
      const md = fmtRmb(b.may);
      rows+=`<div class="numrow">
        <div class="numrow-name">${b.n}</div>
        <div class="numrow-apr" style="color:var(--sal-fg4)">—</div>
        <div class="numrow-arrow">→</div>
        <div class="numrow-may neu">${md}</div>
        <div class="numrow-tag neu">—</div>
      </div>`;
      return;
    }
    const isNeg = b.apr<0;
    const same = b.may===b.apr;
    let mc,tc,tt;
    if(same){mc='neu';tc='neu';tt='持平';}
    else if(b.may>b.apr){mc='up';tc='up';tt=`+¥${(b.may-b.apr).toLocaleString('zh-CN')}`;}
    else{mc=isNeg?'neg':'dn';tc=isNeg?'neg':'dn';tt=isNeg?`¥${Math.abs(b.may).toLocaleString('zh-CN')}`:'-¥'+(b.apr-b.may).toLocaleString('zh-CN');}
    const ad=fmtRmb(b.apr), md=b.may===0?'—':fmtRmb(b.may);
    const arrow=!same&&b.may!==0?'→':'=';
    rows+=`<div class="numrow"><div class="numrow-name">${b.n}</div><div class="numrow-apr">${ad}</div><div class="numrow-arrow">${arrow}</div><div class="numrow-may ${mc}">${md}</div><div class="numrow-tag ${tc}">${tt}</div></div>`;
  });
  document.getElementById('sal-d-chart').innerHTML=rows;
  document.getElementById('sal-overlay').classList.add('show');
  document.body.style.overflow='hidden';
}
function Sal_closeSheet(e){
  if(e&&e.target!==document.getElementById('sal-overlay'))return;
  document.getElementById('sal-overlay').classList.remove('show');
  document.body.style.overflow='';
}

// ═══════════════════════════════════════════
// YEAR CALENDAR
// ═══════════════════════════════════════════
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const calColors = [
  {bg:'var(--sal-tint-blue)',   color:'var(--sal-blue2)'},
  {bg:'var(--sal-tint-red)',    color:'var(--sal-red)'},
  {bg:'var(--sal-tint-green)',  color:'var(--sal-green)'},
  {bg:'var(--sal-tint-orange)', color:'var(--sal-orange)'},
  {bg:'var(--sal-dept-lavender)', color:'var(--sal-blue2)'},
  {bg:'var(--sal-dept-mint)',   color:'var(--sal-green)'},
];

function Sal_openCalendar(){
  const grid = document.getElementById('sal-cal-grid');
  grid.innerHTML='';
  let colorIdx=0;
  for(let m=1;m<=12;m++){
    const cell = document.createElement('div');
    const meta = monthMeta[m];
    if(!meta){
      cell.className='cal-cell empty';
      cell.innerHTML=`<div class="cal-month-name" style="color:#aeaeb2">${MONTH_NAMES[m-1]}</div><div class="cal-empty-label">暂无数据</div>`;
    } else {
      const palette = calColors[colorIdx % calColors.length];
      colorIdx++;
      const prev = meta.prevTotal;
      const curr = meta.total;
      const diff = prev!=null ? curr-prev : null;
      const pct  = diff!=null && prev>0 ? ((diff/prev)*100).toFixed(1) : null;
      const isActive = m===currentMonth;
      cell.className = `cal-cell has-data${isActive?' active-month':''}`;
      cell.style.background = palette.bg;
      let diffHtml='';
      if(diff!=null){
        const c=diff>0?'var(--sal-red)':diff<0?'var(--sal-green)':'var(--sal-fg4)';
        diffHtml=`<div class="cal-diff" style="color:${c}">${diff>=0?'+':''}${pct}%</div>`;
      }
      cell.innerHTML=`
        ${isActive?'<div class="cal-dot"></div>':''}
        <div class="cal-month-name" style="color:${palette.color}">${MONTH_NAMES[m-1]}</div>
        <div class="cal-total" style="color:${palette.color}">¥${Math.round(curr/1000)}k</div>
        ${diffHtml}`;
      cell.onclick=()=>{ Sal_closeCalendar(); Sal_switchMonth(m); };
    }
    grid.appendChild(cell);
  }
  document.getElementById('sal-cal-overlay').classList.add('show');
  document.body.style.overflow='hidden';
}
function Sal_closeCalendar(){
  document.getElementById('sal-cal-overlay').classList.remove('show');
  document.body.style.overflow='';
}
function Sal_calOverlayClick(e){
  if(e.target===document.getElementById('sal-cal-overlay')) Sal_closeCalendar();
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
Sal_renderMonthNav();
Sal_renderKPI();
Sal_renderSummary();
Sal_renderCards('all');
window.Sal_fmt = Sal_fmt;
window.Sal_switchMonth = Sal_switchMonth;
window.Sal_renderMonthNav = Sal_renderMonthNav;
window.Sal_renderKPI = Sal_renderKPI;
window.Sal_renderSummary = Sal_renderSummary;
window.Sal_renderCards = Sal_renderCards;
window.Sal_makeCard = Sal_makeCard;
window.Sal_filterCards = Sal_filterCards;
window.Sal_openSheet = Sal_openSheet;
window.Sal_closeSheet = Sal_closeSheet;
window.Sal_openCalendar = Sal_openCalendar;
window.Sal_closeCalendar = Sal_closeCalendar;
window.Sal_calOverlayClick = Sal_calOverlayClick;