// The services' AI workspace (assets/js/services.js): what the AI answers to each of a line's three requests.
// The requests themselves, the members' names and the documents are in index.html (data-i18n); this file holds the
// answers, in both languages, because they are put together and streamed out by the script.
// Per line, per request (in the order of the requests in index.html):
//   team  the AI team members that take part (positions in the line's member list), in the order they start
//   docs  the documents (positions in the line's cards) this request is about
//   hi    the row of the table the answer comes down to
//   zh / en:
//     notes  what each of those members did, in a few words (same order as team)
//     sum    the conclusion, one sentence (<b> marks the figures it rests on)
//     pts    three to five findings, each with its number
//     tk, th, tr   a small table or ranking: its caption, its column heads, its rows
//     rec    the recommendation (the team decides; this is what we would do first)
// All figures are one consistent made-up project: they agree with the documents' captions and the pop-up's steps in
// index.html (33 of 2,184 parcels, floor area ratio 400%, 18 rules, 23 clashes, 18 mm in 6 places, level 7 four days
// behind, 62% this period, 312 units of equipment, chiller CH-2 in week 3, 12 upgrades), and the three lots' scores
// with the ranks drawn on the scene (services.js CFG.dev.rank, SCORES). No real company, project or client is named.
// scripts/build-fonts.cjs reads every file in assets/js, so the web fonts hold these characters once they are rebuilt.
window.PRISM_SVC = {
  // ---------- 01 development ----------
  dev: [
    { team: [0, 1, 2, 3, 4], docs: [0], hi: 0,
      zh: {
        notes: ["2,184 筆地號，留下 33 筆", "容積率 400%", "捷運 450 m、公園步行 3 分鐘", "3 個量體方案", "內部報酬率 11.8%"],
        sum: "符合條件的地有 <b>33</b> 筆，最值得先看的是 <b>A 地</b>：綜合評分 82，蓋住宅的內部報酬率估計 <b>11.8%</b>。",
        pts: [
          "從 <b>2,184</b> 筆地號中，依面積與使用分區排除 2,151 筆，留下 33 筆。",
          "A 地 <b>612 坪</b>，容積率 400%，可建樓地板面積約 2,448 坪。",
          "步行 <b>450 m</b> 到捷運站、3 分鐘到公園，周邊機能在 33 筆中排第 2。",
          "<b>3</b> 個量體方案中，方案 2（雙棟配置）的可售面積比方案 1 多 6%。"
        ],
        tk: "候選地排名", th: ["候選地", "面積", "評分", "內部報酬率"],
        tr: [["A 地", "612 坪", "82", "11.8%"], ["B 地", "548 坪", "76", "10.4%"], ["C 地", "705 坪", "69", "9.1%"]],
        rec: "先針對 A 地做產權與地上物調查，B 地列為備案。C 地面積最大，但臨路條件限制了車道出入，建議暫緩。"
      },
      en: {
        notes: ["2,184 parcels screened, 33 kept", "Floor area ratio 400%", "Metro 450 m, park 3 min on foot", "3 massing options", "IRR 11.8%"],
        sum: "<b>33</b> parcels meet your criteria. Start with <b>Site A</b>: an overall score of 82, and an estimated IRR of <b>11.8%</b> for housing.",
        pts: [
          "Of <b>2,184</b> parcels, 2,151 were ruled out by area and zoning. 33 remain.",
          "Site A is <b>2,023 m²</b> (612 ping). At a floor area ratio of 400% it allows about 8,090 m² of floor area.",
          "It is <b>450 m</b> from a metro station and 3 minutes on foot from a park: second of the 33 for amenities.",
          "Of the <b>3</b> massing options, option 2 (two blocks) gives 6% more saleable area than option 1."
        ],
        tk: "Shortlist", th: ["Site", "Area", "Score", "IRR"],
        tr: [["Site A", "2,023 m²", "82", "11.8%"], ["Site B", "1,812 m²", "76", "10.4%"], ["Site C", "2,331 m²", "69", "9.1%"]],
        rec: "Look into Site A's ownership and existing structures first, and keep Site B as the alternative. Site C is the largest, but its road frontage limits vehicle access; we suggest putting it on hold."
      } },
    { team: [0, 1, 2, 3, 4], docs: [0], hi: 0,
      zh: {
        notes: ["2,184 筆地號，留下 21 筆", "容積率 400%，可作辦公使用", "捷運 300 m、臨 30 m 道路", "3 個量體方案", "內部報酬率 9.6%"],
        sum: "可以蓋辦公的地有 <b>21</b> 筆，最合適的是 <b>B 地</b>：臨 30 m 道路、離捷運 300 m，綜合評分 82。",
        pts: [
          "<b>2,184</b> 筆地號中，面積與使用分區都符合辦公的有 21 筆。",
          "B 地 <b>548 坪</b>，容積率 400%，可建樓地板面積約 2,192 坪。",
          "規劃地上 <b>10 層</b>，標準層約 215 坪，適合整層出租的中型辦公。",
          "500 m 內現有辦公大樓 <b>6 棟</b>，平均屋齡 27 年，近五年沒有新供給。"
        ],
        tk: "候選地排名", th: ["候選地", "面積", "評分", "內部報酬率"],
        tr: [["B 地", "548 坪", "82", "9.6%"], ["C 地", "705 坪", "76", "8.8%"], ["A 地", "612 坪", "69", "7.9%"]],
        rec: "B 地先比較整棟出租與分層出售兩種情境的報酬；C 地量體較大，建議同步確認停車與交通影響評估的門檻。"
      },
      en: {
        notes: ["2,184 parcels screened, 21 kept", "Floor area ratio 400%, offices allowed", "Metro 300 m, on a 30 m road", "3 massing options", "IRR 9.6%"],
        sum: "<b>21</b> parcels can take offices. <b>Site B</b> fits best: on a 30 m road, 300 m from the metro, with an overall score of 82.",
        pts: [
          "Of <b>2,184</b> parcels, 21 are large enough and zoned for offices.",
          "Site B is <b>1,812 m²</b> (548 ping). At a floor area ratio of 400% it allows about 7,250 m² of floor area.",
          "<b>Ten storeys</b> above ground with floors of about 710 m²: a mid-sized office building, let floor by floor.",
          "There are <b>6</b> office buildings within 500 m, 27 years old on average, and no new supply in the last five years."
        ],
        tk: "Shortlist", th: ["Site", "Area", "Score", "IRR"],
        tr: [["Site B", "1,812 m²", "82", "9.6%"], ["Site C", "2,331 m²", "76", "8.8%"], ["Site A", "2,023 m²", "69", "7.9%"]],
        rec: "For Site B, compare the returns of letting the whole building and of selling it floor by floor. Site C allows a larger building, so check the thresholds for parking and a traffic impact assessment at the same time."
      } },
    { team: [0, 1, 2, 3, 4], docs: [0], hi: 0,
      zh: {
        notes: ["2,184 筆地號，留下 9 筆", "容積率 400%、建蔽率 60%", "步行 10 分鐘內約 3.8 萬人", "3 個量體方案", "內部報酬率 10.2%"],
        sum: "適合商場的地只有 <b>9</b> 筆，首選是 <b>C 地</b>：705 坪、雙面臨路，綜合評分 82。",
        pts: [
          "商場需要足夠的面寬與車道動線，<b>2,184</b> 筆地號中只有 9 筆符合。",
          "C 地雙面臨路、面寬 <b>48 m</b>，建蔽率 60%，單層可規劃約 420 坪的賣場。",
          "步行 10 分鐘的範圍內，居住人口約 <b>3.8 萬人</b>。",
          "1 公里內已有 <b>2 座</b>商場，最近的一座距離 650 m。"
        ],
        tk: "候選地排名", th: ["候選地", "面積", "評分", "內部報酬率"],
        tr: [["C 地", "705 坪", "82", "10.2%"], ["A 地", "612 坪", "76", "9.3%"], ["B 地", "548 坪", "69", "8.1%"]],
        rec: "C 地先做交通影響與停車數量的初步檢討，再比較「商場加住宅」與「純商場」兩種量體。"
      },
      en: {
        notes: ["2,184 parcels screened, 9 kept", "Floor area ratio 400%, coverage 60%", "38,000 residents within a 10-minute walk", "3 massing options", "IRR 10.2%"],
        sum: "Only <b>9</b> parcels suit a shopping centre. The first choice is <b>Site C</b>: 2,331 m² (705 ping) with roads on two sides, and an overall score of 82.",
        pts: [
          "A shopping centre needs frontage and room for vehicle access. Only 9 of <b>2,184</b> parcels have both.",
          "Site C has roads on two sides and <b>48 m</b> of frontage. At 60% site coverage, each floor can hold about 1,390 m² of retail.",
          "About <b>38,000</b> people live within a 10-minute walk.",
          "There are already <b>2</b> shopping centres within 1 km, the nearest 650 m away."
        ],
        tk: "Shortlist", th: ["Site", "Area", "Score", "IRR"],
        tr: [["Site C", "2,331 m²", "82", "10.2%"], ["Site A", "2,023 m²", "76", "9.3%"], ["Site B", "1,812 m²", "69", "8.1%"]],
        rec: "Start with a first check of traffic impact and parking numbers for Site C, then compare two massings: retail with housing above, and retail only."
      } }
  ],

  // ---------- 02 design ----------
  design: [
    { team: [0, 1, 3], docs: [0, 1], hi: 0,
      zh: {
        notes: ["退縮、高度、容積共 18 條", "冬至日 9 至 15 時", "3 個方案的樓地板面積"],
        sum: "三個方案中只有 <b>方案 A</b> 完全符合法規，冬至日落在北側鄰地的陰影也最少。",
        pts: [
          "逐條檢討退縮、高度、容積共 <b>18 條</b>：方案 A 全數符合，方案 C 有 1 條待確認。",
          "方案 B 超出限高 <b>14.6 m</b>，大約是 4 層樓的高度。",
          "冬至日 9 至 15 時，方案 A 讓北側鄰地保有 <b>4.2 小時</b>日照，方案 B 只有 2.1 小時。",
          "方案 C 的西向立面在夏季受熱最多，比方案 A 高 <b>18%</b>。"
        ],
        tk: "方案比較", th: ["方案", "法規", "冬至日照", "高度"],
        tr: [["方案 A", "18 條符合", "4.2 小時", "45.6 m"], ["方案 B", "超出限高", "2.1 小時", "64.6 m"], ["方案 C", "1 條待確認", "3.4 小時", "49.2 m"]],
        rec: "方案 A 可以直接往下發展。如果偏好方案 B 的配置，需要先減 4 層，再重新檢討日照。"
      },
      en: {
        notes: ["18 rules on setbacks, height and floor area", "Winter solstice, 9:00 to 15:00", "Floor areas of the 3 options"],
        sum: "Of the three options, only <b>option A</b> complies with every rule. It also casts the least shadow on the neighbours to the north at the winter solstice.",
        pts: [
          "All <b>18 rules</b> on setbacks, height and floor area were checked one by one. Option A meets every one; option C has 1 still to confirm.",
          "Option B is <b>14.6 m</b> over the height limit, about four storeys.",
          "Between 9:00 and 15:00 at the winter solstice, option A leaves the neighbours to the north <b>4.2 hours</b> of sun; option B leaves 2.1.",
          "Option C's west facade takes the most heat in summer, <b>18%</b> more than option A."
        ],
        tk: "The options", th: ["Option", "Code", "Solstice sun", "Height"],
        tr: [["Option A", "18 of 18", "4.2 h", "45.6 m"], ["Option B", "Over height", "2.1 h", "64.6 m"], ["Option C", "1 to confirm", "3.4 h", "49.2 m"]],
        rec: "Option A can go straight on to the next stage. If you prefer option B's layout, it has to lose four storeys first, and the sunlight has to be checked again."
      } },
    { team: [0, 1, 3], docs: [3], hi: 0,
      zh: {
        notes: ["3 個方案的容積樓地板面積", "外牆受熱與空調負荷", "結構、外牆、機電數量"],
        sum: "<b>方案 A</b> 最省：每坪造價比方案 B 低 <b>6%</b>，差距主要來自結構與外牆。",
        pts: [
          "每坪造價概算：方案 A <b>18.6 萬元</b>、方案 B 19.8 萬元、方案 C 19.1 萬元。",
          "方案 B 多 4 層，柱與基礎加大，每坪鋼筋用量多 <b>11%</b>。",
          "方案 C 的曲面外牆有 <b>38%</b> 是非標準單元，外牆單價最高。",
          "方案 A 的標準層重複 <b>11 次</b>，模板與帷幕單元可以重複使用。"
        ],
        tk: "造價概算", th: ["方案", "每坪造價", "結構", "外牆"],
        tr: [["方案 A", "18.6 萬", "基準", "基準"], ["方案 B", "19.8 萬", "+9%", "+3%"], ["方案 C", "19.1 萬", "+2%", "+12%"]],
        rec: "以成本為優先的話，選方案 A。若想保留方案 C 的造型，把曲面集中在低樓層，估計可以收回大約一半的外牆價差。"
      },
      en: {
        notes: ["Floor areas of the 3 options", "Heat on the facades, cooling load", "Structure, facade and services quantities"],
        sum: "<b>Option A</b> costs the least: <b>6%</b> less per square metre than option B. Most of the difference is in the structure and the facade.",
        pts: [
          "Estimated cost per m²: option A <b>NT$56,300</b>, option B NT$59,900, option C NT$57,800.",
          "Option B has four more storeys, so its columns and foundations are larger: <b>11%</b> more reinforcement per m².",
          "<b>38%</b> of option C's curved facade is non-standard units, which gives it the highest facade rate.",
          "Option A repeats its typical floor <b>11 times</b>, so formwork and curtain-wall units can be reused."
        ],
        tk: "Cost estimate", th: ["Option", "Per m²", "Structure", "Facade"],
        tr: [["Option A", "NT$56,300", "Baseline", "Baseline"], ["Option B", "NT$59,900", "+9%", "+3%"], ["Option C", "NT$57,800", "+2%", "+12%"]],
        rec: "If cost comes first, choose option A. To keep option C's form, keep the curves to the lower floors: we estimate that recovers about half of the difference in facade cost."
      } },
    { team: [2, 3, 4], docs: [2], hi: 0,
      zh: {
        notes: ["比對結構、機電、建築 3 個模型", "估算修改影響的數量", "依 BEP 對應負責單位"],
        sum: "有。結構與管線共 <b>23</b> 處衝突，其中 <b>5</b> 處會影響淨高，需要在發包前解決。",
        pts: [
          "<b>23 處</b>衝突包含風管穿梁 9 處、消防管與梁 8 處、排水管與柱 6 處。",
          "最集中的位置在 B1 機房上方與 3F 轉換層，合計 <b>14 處</b>。",
          "有 <b>5 處</b>會讓走道淨高低於 2.4 m，需要調整梁深或管線路徑。",
          "其餘 <b>18 處</b>調整管線高程就能解決，不影響結構。"
        ],
        tk: "衝突清單", th: ["類型", "數量", "影響淨高"],
        tr: [["風管與梁", "9 處", "3 處"], ["消防管與梁", "8 處", "2 處"], ["排水管與柱", "6 處", "0 處"]],
        rec: "建議先開一次協調會處理影響淨高的 5 處；其餘 18 處依 BEP 的分工交給機電顧問修改，改完再檢查一次。"
      },
      en: {
        notes: ["Structure, services and architecture models compared", "Quantities affected by the changes", "Each clash matched to its owner in the BEP"],
        sum: "Yes. There are <b>23</b> clashes between structure and services. <b>5</b> of them affect clear height and need to be resolved before tender.",
        pts: [
          "The <b>23</b> clashes: 9 ducts through beams, 8 sprinkler pipes against beams, 6 drainage pipes against columns.",
          "Most are above the B1 plant room and at the level 3 transfer floor: <b>14</b> between them.",
          "<b>5</b> would bring corridor clear height below 2.4 m. They need a change of beam depth or pipe route.",
          "The other <b>18</b> can be solved by changing pipe levels, with no effect on the structure."
        ],
        tk: "Clashes", th: ["Type", "Count", "Affect clear height"],
        tr: [["Ducts and beams", "9", "3"], ["Sprinkler pipes and beams", "8", "2"], ["Drainage pipes and columns", "6", "0"]],
        rec: "We suggest one coordination meeting for the 5 that affect clear height. The other 18 go to the services consultant, as the BEP assigns them, and are checked again once changed."
      } }
  ],

  // ---------- 03 construction ----------
  build: [
    { team: [0, 1, 3], docs: [1], hi: 0,
      zh: {
        notes: ["核對 7F 樓板的完成範圍", "比對 86 個工項的計畫與實際", "讀取本月 22 份工作日誌"],
        sum: "整體落後 <b>4 天</b>，原因集中在 7F 樓板；其餘 84 個工項如期或提前。",
        pts: [
          "本月 <b>86</b> 個工項中，79 個如期、5 個提前、2 個落後。",
          "7F 樓板原訂 12 日澆置，實際 16 日完成，落後 <b>4 天</b>。",
          "工作日誌顯示，原因是連續 <b>3 天</b>降雨，加上鋼筋晚 1 天進場。",
          "7F 樓板在要徑上，不趕工的話，<b>8F 以上</b>的工項會跟著順延。"
        ],
        tk: "落後與提前的工項", th: ["工項", "計畫", "實際", "差異"],
        tr: [["7F 樓板澆置", "12 日", "16 日", "落後 4 天"], ["7F 機電配管", "14 日", "17 日", "落後 3 天"], ["外牆鷹架", "20 日", "18 日", "提前 2 天"]],
        rec: "建議 8F 的模板與鋼筋增加一組人力，目標在兩週內追回 4 天；下一次現場掃描後，再更新一次進度。"
      },
      en: {
        notes: ["Level 7 slab checked against the scan", "86 work items, planned against actual", "22 daily logs read this month"],
        sum: "The job is <b>4 days</b> behind, and the cause is the level 7 slab. The other 84 work items are on time or ahead.",
        pts: [
          "Of this month's <b>86</b> work items, 79 are on time, 5 ahead and 2 behind.",
          "The level 7 slab was planned for the 12th and poured on the 16th: <b>4 days</b> late.",
          "The daily logs give the cause: <b>3 days</b> of rain in a row, and reinforcement delivered a day late.",
          "The slab is on the critical path. Without catching up, everything from <b>level 8</b> upwards moves back with it."
        ],
        tk: "Late and early items", th: ["Item", "Planned", "Actual", "Difference"],
        tr: [["Level 7 slab pour", "12th", "16th", "4 days late"], ["Level 7 services", "14th", "17th", "3 days late"], ["Facade scaffolding", "20th", "18th", "2 days early"]],
        rec: "We suggest a second crew on the level 8 formwork and reinforcement, aiming to recover the 4 days within two weeks. Progress is updated again after the next site scan."
      } },
    { team: [0, 3, 4], docs: [0], hi: 0,
      zh: {
        notes: ["比對 2,400 萬個掃描點與模型", "對照 7F 的查驗紀錄", "整理 6 處的改善通知"],
        sum: "大致一樣。有 <b>6 處</b>柱位偏移超出容許值，最大 <b>18 mm</b>，都在 7F。",
        pts: [
          "比對 <b>2,400 萬</b>個掃描點與模型，檢查了 7F 的 48 支柱與 62 支梁。",
          "48 支柱有 42 支在容許值 ±10 mm 以內，<b>6 支</b>超出，偏移 12 至 18 mm。",
          "偏移最大的是 C-4 柱，往東 <b>18 mm</b>，會影響帷幕牆預埋件的位置。",
          "樓板高程的誤差都在 <b>±8 mm</b> 以內，全部合格。"
        ],
        tk: "偏移最大的 4 支柱", th: ["柱位", "偏移", "方向"],
        tr: [["C-4", "18 mm", "往東"], ["C-5", "15 mm", "往東"], ["D-4", "14 mm", "往東北"], ["B-7", "12 mm", "往南"]],
        rec: "C-4、C-5 建議在帷幕牆放樣前，請結構技師確認是否需要修正；其餘 4 支調整預埋件位置即可。改善通知的草稿已經整理好。"
      },
      en: {
        notes: ["24 million scan points against the model", "Level 7 inspection records cross-checked", "Correction notices drafted for 6 places"],
        sum: "Mostly, yes. Column offsets are out of tolerance in <b>6 places</b>, <b>18 mm</b> at most, all on level 7.",
        pts: [
          "<b>24 million</b> scan points were compared with the model: 48 columns and 62 beams on level 7.",
          "42 of the 48 columns are within the ±10 mm tolerance. <b>6</b> are outside it, by 12 to 18 mm.",
          "Column C-4 is the furthest out, <b>18 mm</b> to the east, which affects where the curtain-wall embeds go.",
          "Slab levels are all within <b>±8 mm</b> and pass."
        ],
        tk: "The four largest offsets", th: ["Column", "Offset", "Direction"],
        tr: [["C-4", "18 mm", "East"], ["C-5", "15 mm", "East"], ["D-4", "14 mm", "North-east"], ["B-7", "12 mm", "South"]],
        rec: "For C-4 and C-5, ask the structural engineer whether a correction is needed before the curtain wall is set out. For the other 4, moving the embeds is enough. The correction notices are drafted."
      } },
    { team: [0, 1, 2], docs: [2], hi: 0,
      zh: {
        notes: ["以掃描核對完成數量", "確認 37 個計價工項的進度", "依完成比例試算本期計價"],
        sum: "本期預定工項完成 <b>62%</b>，核算可計價 <b>1,860 萬元</b>；承包商申請 2,000 萬元，有 140 萬元的差額需要釐清。",
        pts: [
          "本期預定計價 3,000 萬元，依現場完成數量核算為 <b>62%</b>，也就是 1,860 萬元。",
          "<b>37</b> 個計價工項中，34 個與申請數量相符，3 個有差異。",
          "8F 柱牆申請 100%，掃描顯示完成 70%，差額 <b>90 萬元</b>。",
          "外牆鷹架與 6F 機電配管的申請金額，分別多出 <b>30 萬元</b>與 20 萬元。"
        ],
        tk: "有差異的工項", th: ["工項", "申請", "核算", "差額"],
        tr: [["8F 柱牆", "100%", "70%", "90 萬"], ["外牆鷹架", "100%", "88%", "30 萬"], ["6F 機電配管", "100%", "90%", "20 萬"]],
        rec: "建議先依核算的 1,860 萬元辦理計價；3 個差異工項附上掃描畫面請承包商說明，補做完成後併入下一期。"
      },
      en: {
        notes: ["Completed quantities checked against the scan", "Progress of 37 priced items confirmed", "This period valued by share completed"],
        sum: "<b>62%</b> of this period's planned work is complete, which values it at <b>NT$18.6 million</b>. The contractor has applied for NT$20 million, so NT$1.4 million needs clarifying.",
        pts: [
          "NT$30 million was planned for this period. Measured on site, <b>62%</b> is complete: NT$18.6 million.",
          "34 of the <b>37</b> priced items match the quantities applied for. 3 differ.",
          "Level 8 columns and walls: 100% applied for, 70% complete in the scan, a difference of <b>NT$900,000</b>.",
          "Facade scaffolding and level 6 services are over by <b>NT$300,000</b> and NT$200,000."
        ],
        tk: "Items that differ", th: ["Item", "Applied", "Measured", "Difference"],
        tr: [["Level 8 columns and walls", "100%", "70%", "NT$900k"], ["Facade scaffolding", "100%", "88%", "NT$300k"], ["Level 6 services", "100%", "90%", "NT$200k"]],
        rec: "We suggest paying the measured NT$18.6 million now. Send the contractor the scan views of the 3 items for an explanation, and include them in the next period once the work is done."
      } }
  ],

  // ---------- 04 operations ----------
  ops: [
    { team: [0, 1, 2, 3], docs: [1], hi: 0,
      zh: {
        notes: ["匯入竣工資料 4,630 份", "建立 312 台設備履歷", "讀取 1,284 筆維修紀錄", "依風險排出先後"],
        sum: "明年的維護計畫排好了：<b>312</b> 台設備、<b>1,460</b> 項保養工作。最近的一項是冰水主機 CH-2，建議第 3 週保養。",
        pts: [
          "從 <b>4,630</b> 份竣工資料建立 312 台設備的履歷，每一台都連到它在建築裡的位置。",
          "依 <b>1,284</b> 筆維修紀錄與原廠建議的週期，排出全年 1,460 項保養工作。",
          "冰水主機 CH-2 已運轉 <b>5,800 小時</b>，接近 6,000 小時的保養週期，所以排在第 3 週。",
          "把同樓層、同廠商的工作排在同一天，廠商進場從 210 次減為 <b>148 次</b>。"
        ],
        tk: "第一季的重點工作", th: ["設備", "工作", "時間"],
        tr: [["冰水主機 CH-2", "年度保養", "第 3 週"], ["電梯 1 至 4 號", "安全檢查", "第 5 週"], ["消防泵", "性能測試", "第 8 週"], ["空調箱 AHU-7", "更換皮帶與濾網", "第 11 週"]],
        rec: "CH-2 的保養排在冬季低負載的時段，不影響空調供應。排程可以匯出到你們現有的物管系統，每個月依新的維修紀錄更新。"
      },
      en: {
        notes: ["4,630 as-built documents imported", "Records for 312 units of equipment", "1,284 maintenance records read", "Ordered by risk"],
        sum: "Next year's plan is drawn up: <b>312</b> units of equipment and <b>1,460</b> maintenance tasks. The first is chiller CH-2, due for service in week 3.",
        pts: [
          "Records for 312 units of equipment were built from <b>4,630</b> as-built documents, each unit linked to its place in the building.",
          "From <b>1,284</b> maintenance records and the makers' recommended intervals, the year comes to 1,460 tasks.",
          "Chiller CH-2 has run <b>5,800 hours</b> and is close to its 6,000-hour service, so it goes in week 3.",
          "Tasks on the same floor for the same contractor share a day, which cuts site visits from 210 to <b>148</b>."
        ],
        tk: "First quarter", th: ["Equipment", "Task", "When"],
        tr: [["Chiller CH-2", "Annual service", "Week 3"], ["Lifts 1 to 4", "Safety inspection", "Week 5"], ["Fire pumps", "Performance test", "Week 8"], ["Air handler AHU-7", "Belts and filters", "Week 11"]],
        rec: "CH-2's service falls in winter, when the load is low, so cooling is not affected. The schedule can be exported to the property management system you already use, and is updated each month from new maintenance records."
      } },
    { team: [0, 1, 3], docs: [0, 2], hi: 0,
      zh: {
        notes: ["查出每台設備的建議使用年限", "312 台設備的年數與故障次數", "依風險與費用排序"],
        sum: "最該先換的有 <b>12</b> 項。排第一的是冰水主機 <b>CH-1</b>：已使用 17 年，近兩年故障 7 次。",
        pts: [
          "312 台設備中，有 <b>41 台</b>已超過原廠建議的使用年限。",
          "把故障次數、停機影響與更換費用一起計算，排出 <b>12 項</b>優先更新。",
          "CH-1 近兩年故障 <b>7 次</b>，平均每次停機 9 小時，影響 6 個樓層的空調。",
          "前 3 項的更換費用約 <b>860 萬元</b>，佔 12 項總額的 54%。"
        ],
        tk: "優先更新的前 4 項", th: ["設備", "使用年數", "近兩年故障", "風險"],
        tr: [["冰水主機 CH-1", "17 年", "7 次", "高"], ["發電機蓄電池組", "9 年", "3 次", "高"], ["冷卻水塔風扇 CT-2", "15 年", "5 次", "中"], ["空調箱 AHU-3", "16 年", "4 次", "中"]],
        rec: "CH-1 建議排在明年第一季更換，可以和 CH-2 的保養安排在同一次進場；其餘 9 項可以分兩年編列預算。"
      },
      en: {
        notes: ["Recommended service life found for each unit", "Age and breakdowns of 312 units", "Ranked by risk and cost"],
        sum: "<b>12</b> items should be replaced first. At the top is chiller <b>CH-1</b>: 17 years in use, with 7 breakdowns in the last two years.",
        pts: [
          "<b>41</b> of the 312 units are past the service life their makers recommend.",
          "Counting breakdowns, the effect of downtime and the cost of replacement together gives <b>12</b> upgrades to do first.",
          "CH-1 has broken down <b>7 times</b> in two years, for 9 hours on average, each time affecting the cooling of 6 floors.",
          "Replacing the first 3 costs about <b>NT$8.6 million</b>, 54% of the total for all 12."
        ],
        tk: "The first four", th: ["Equipment", "Years in use", "Breakdowns, 2 years", "Risk"],
        tr: [["Chiller CH-1", "17", "7", "High"], ["Generator battery bank", "9", "3", "High"], ["Cooling tower fan CT-2", "15", "5", "Medium"], ["Air handler AHU-3", "16", "4", "Medium"]],
        rec: "We suggest replacing CH-1 in the first quarter of next year, on the same visit as CH-2's service. The other 9 can be budgeted over two years."
      } },
    { team: [0, 1, 2, 3], docs: [2], hi: 0,
      zh: {
        notes: ["對照設備規格與 24 個月電費單", "讀取 1,284 筆維修紀錄", "找出可以合併的進場", "依回收年限排序"],
        sum: "找到 <b>5</b> 個做法，估計每年可以省下約 <b>8%</b> 的營運成本，其中 3 個不需要額外投資。",
        pts: [
          "空調佔全棟用電的 <b>46%</b>；夜間低負載時，兩台冰水主機仍然同時運轉。",
          "夜間改成單台運轉，估計每年省電 <b>21 萬度</b>。",
          "緊急維修佔維修費用的 <b>38%</b>；改成預防保養後，估計可以降到 25% 以下。",
          "把廠商進場依樓層合併，全年可以再減少 <b>30 次</b>。"
        ],
        tk: "做法與效益", th: ["做法", "每年可省", "投資"],
        tr: [["冰水主機夜間單台運轉", "63 萬", "不需要"], ["預防保養取代緊急維修", "48 萬", "不需要"], ["合併廠商進場", "15 萬", "不需要"], ["公共區照明改用 LED", "36 萬", "120 萬"], ["更換冰水主機 CH-1", "72 萬", "680 萬"]],
        rec: "建議先做不需要投資的 3 項，三個月後用電費單核對成效；照明與 CH-1 再依回收年限，排入之後兩年的預算。"
      },
      en: {
        notes: ["Equipment specifications against 24 months of electricity bills", "1,284 maintenance records read", "Site visits that can be combined", "Ranked by payback period"],
        sum: "We found <b>5</b> measures that together should save about <b>8%</b> of operating costs a year. 3 of them need no investment.",
        pts: [
          "Cooling is <b>46%</b> of the building's electricity. At night, under low load, both chillers still run together.",
          "Running one chiller at night should save about <b>210,000 kWh</b> a year.",
          "Emergency repairs are <b>38%</b> of maintenance spending. With preventive maintenance that should fall below 25%.",
          "Combining contractors' visits by floor removes another <b>30</b> visits a year."
        ],
        tk: "Measures and savings", th: ["Measure", "Saves a year", "Investment"],
        tr: [["One chiller at night", "NT$630k", "None"], ["Preventive, not emergency, maintenance", "NT$480k", "None"], ["Combined site visits", "NT$150k", "None"], ["LED lighting in common areas", "NT$360k", "NT$1.2M"], ["Replace chiller CH-1", "NT$720k", "NT$6.8M"]],
        rec: "We suggest starting with the 3 that need no investment and checking the result against the electricity bills after three months. The lighting and CH-1 then go into the next two years' budgets by payback period."
      } }
  ]
};
