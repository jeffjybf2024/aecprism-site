// The services overview (the circuit board between the services film and VISION): its content.
// phase -> roles -> rows of [what the role has to do, how AEC PRISM's AI helps, what comes out of it].
// The roles and their work follow public job descriptions and the usual division of work on a building project in
// Taiwan; the AI column and the outputs follow the four service lines where they match and are proposals elsewhere
// (to be confirmed by the team). links: pairs of roles (by position) that work closely together.
// scripts/build-fonts.cjs reads this file too: the web fonts hold exactly the characters used here.
window.OVERVIEW_DATA = [
  { id: "dev", n: "開發", links: [[0, 1], [0, 2], [2, 3], [0, 4]], roles: [
    ["開發部門", [
      ["土地評估與取得", "全市土地依條件篩選並評分", "潛力地排行報告"],
      ["地主整合與談判", "彙整地籍、權屬與周邊行情", "整合評估資料包"],
      ["開發可行性評估", "自動試算法規容積與量體", "可行性評估報告"],
      ["投資效益試算", "依方案試算成本、售價與報酬", "投報試算表"]]],
    ["代銷", [
      ["市場調查與產品定位", "彙整區域行情、供給與機能", "市場分析報告"],
      ["定價與銷售策略", "比對周邊個案與成交行情", "定價建議表"],
      ["接待中心與廣告企劃", "用 3D 方案產生展示內容", "可互動的 3D 方案網頁"],
      ["銷售進度追蹤", "自動彙整來客與成交資料", "銷售週報"]]],
    ["建築師", [
      ["法規與容積檢討", "比對土地使用分區與法規條文", "法規檢討表"],
      ["量體配置方案", "依容積與退縮產生多個量體", "量體方案比較"],
      ["日照與景觀初評", "模擬各方案的日照與陰影", "環境初評圖"],
      ["建照申請規劃", "整理送審文件與檢核項目", "送件檢核清單"]]],
    ["綠建築顧問", [
      ["綠建築等級目標設定", "依基地條件試算各指標得分", "等級目標建議"],
      ["候選證書可行性評估", "檢查各指標的達成條件", "指標檢核表"],
      ["日照與通風初步分析", "快速模擬日照與風場", "環境分析報告"],
      ["節能策略建議", "比較外殼與設備方案的能耗", "節能方案比較"]]],
    ["財務", [
      ["開發成本估算", "依量體與單價自動估算", "成本估算表"],
      ["融資與資金規劃", "依時程試算資金需求", "資金需求時程表"],
      ["現金流與報酬分析", "多情境試算現金流與報酬率", "財務試算報告"],
      ["風險與敏感度分析", "變動售價、成本與利率重算", "敏感度分析表"]]]] },
  { id: "design", n: "設計", links: [[0, 1], [0, 2], [3, 0], [3, 1], [3, 2], [0, 4]], roles: [
    ["建築師", [
      ["建築設計與圖說", "檢查圖面與模型是否一致", "圖模一致性報告"],
      ["法規檢討", "逐條檢討退縮、高度與容積", "法規檢討表"],
      ["建照與都審送件", "整理送審圖說與檢核項目", "送件檢核清單"],
      ["各專業圖面整合", "整合建築、結構、機電模型", "整合模型與問題清單"]]],
    ["結構技師", [
      ["結構系統規劃", "比較不同結構系統的用量", "結構方案比較"],
      ["結構計算與簽證", "彙整計算書所需的模型資料", "計算資料彙整"],
      ["耐震設計檢討", "檢查構件配置與規範條件", "檢討紀錄表"],
      ["結構與建築圖面核對", "自動比對梁柱與建築圖", "不一致清單"]]],
    ["機電技師", [
      ["機電系統設計", "依空間需求估算設備容量", "設備容量試算"],
      ["管線空間協調", "偵測管線與結構的衝突", "衝突檢查報告"],
      ["機房與管道間配置", "檢查淨高與維修空間", "空間檢核表"],
      ["設備數量統計", "從模型自動產出數量", "設備數量表"]]],
    ["BIM 經理", [
      ["訂定 BEP 與 EIR", "依 ISO 19650 產生文件並檢查缺漏", "BEP／EIR 文件"],
      ["模型整合與衝突檢討", "自動跑衝突檢查並分類", "衝突檢查報告"],
      ["模型品質查核", "檢查命名、屬性與建模標準", "模型查核報告"],
      ["數量產出", "從模型產出數量並對照圖面", "數量概算表"]]],
    ["綠建築顧問", [
      ["外殼節能與能效計算", "從模型讀取外殼資料計算", "能效計算書"],
      ["日照與風場模擬", "比較各方案的陰影與通風", "方案比較報告"],
      ["綠建築指標檢討", "逐項檢查指標得分", "指標檢核表"],
      ["候選證書送審", "整理送審所需文件", "送審文件包"]]]] },
  { id: "build", n: "營造", links: [[0, 1], [0, 4], [1, 3], [2, 3], [2, 0]], roles: [
    ["專案經理", [
      ["施工計畫與預算", "從模型產出數量與預算基準", "預算基準表"],
      ["進度控管", "比對計畫與實際進度", "進度報告"],
      ["成本控管", "依完成比例試算成本", "成本追蹤表"],
      ["業主與協力廠商協調", "彙整待辦與審查意見", "會議追蹤清單"]]],
    ["工地主任", [
      ["現場施工調度", "依進度排出近期工項", "三週滾動計畫"],
      ["人機料每日安排", "依工項估算人力與材料", "每日需求表"],
      ["施工日誌", "自動整理當日紀錄與照片", "施工日誌"],
      ["工地問題回報", "把問題標在模型位置上", "問題追蹤清單"]]],
    ["監造", [
      ["施工品質查驗", "用現場掃描比對模型", "品質報告"],
      ["材料與設備審查", "比對送審資料與規範", "審查意見表"],
      ["估驗計價審核", "依完成比例核對計價", "計價審核表"],
      ["審查意見回覆追蹤", "整理意見與回覆狀態", "審查追蹤表"]]],
    ["品管與安衛", [
      ["品質計畫與自主檢查", "依工項產生檢查表", "自主檢查表"],
      ["缺失改善追蹤", "把缺失對到位置並追蹤", "缺失追蹤清單"],
      ["職安衛巡檢", "彙整巡檢紀錄與照片", "巡檢報告"],
      ["施工偏差檢查", "掃描比對找出偏移位置", "偏差標示圖"]]],
    ["採購發包", [
      ["分包發包與比價", "從模型產出發包數量", "發包數量表"],
      ["材料採購與交期", "依進度推算到料時間", "採購時程表"],
      ["合約與變更管理", "比對變更前後的數量差異", "變更數量比較"],
      ["計價與請款", "依完成比例試算本期計價", "計價報告"]]]] },
  { id: "ops", n: "營運", links: [[0, 1], [1, 3], [2, 0], [2, 3]], roles: [
    ["物業管理", [
      ["住戶與租戶服務", "彙整報修與服務紀錄", "服務紀錄報表"],
      ["日常管理", "排出巡檢與清潔保全工作", "例行工作排程"],
      ["管理費與修繕基金", "依修繕計畫試算基金需求", "基金試算表"],
      ["管理報告", "自動彙整每月營運資料", "物業管理報表"]]],
    ["設施維護", [
      ["設備定期保養", "依使用年限與紀錄排程", "維護排程"],
      ["故障叫修處理", "把設備對到建築裡的位置", "設備定位與履歷"],
      ["設備履歷管理", "從竣工資料建立履歷", "設備履歷"],
      ["備品管理", "依維修紀錄估算備品需求", "備品清單"]]],
    ["資產管理", [
      ["長期修繕計畫", "依風險與成本排優先順序", "長期修繕計畫"],
      ["營運成本與預算", "彙整歷年支出並預估", "年度預算建議"],
      ["資產更新評估", "比較維修與更新的成本", "更新評估報告"],
      ["竣工資料管理", "整理竣工圖說與文件", "可查詢的資產資料"]]],
    ["能源管理", [
      ["能耗監測與分析", "彙整各系統的用電資料", "能耗分析報告"],
      ["節能改善方案", "比較改善方案的效益", "節能方案比較"],
      ["建築能效申報", "整理申報所需資料", "申報資料包"],
      ["設備運轉最佳化", "找出異常耗能的設備", "異常設備清單"]]]] }
];

// English for everything above and for the words the overview puts on screen itself (Chinese -> English).
window.OVERVIEW_EN = {
  "開發": "Develop", "設計": "Design", "營造": "Build", "營運": "Operate",
  "個角色": "roles", "項工作": "tasks",
  "點任何一顆晶片，靠過去看。": "Click any chip to move in on it.",
  "點一個角色看他的工作；點空白處退回全圖。": "Click a role to see its work; click empty space to go back to the whole board.",
  "點空白處退回上一層。": "Click empty space to go back a level.",
  "點晶片靠過去看；按住左鍵可以拖動畫面。": "Click a chip to move in; hold the left button to drag the board.",
  "點角色看他的工作；按住左鍵拖動，點空白處退回。": "Click a role to see its work; drag to move, click empty space to go back.",
  "按住左鍵拖動；點空白處退回上一層。": "Drag to move; click empty space to go back a level.",
  "開發部門": "Development team", "代銷": "Sales agency", "建築師": "Architect", "綠建築顧問": "Green consultant", "財務": "Finance",
  "結構技師": "Structural engineer", "機電技師": "MEP engineer", "BIM 經理": "BIM manager",
  "專案經理": "Project manager", "工地主任": "Site manager", "監造": "Supervisor", "品管與安衛": "Quality and safety", "採購發包": "Procurement",
  "物業管理": "Property management", "設施維護": "Facility maintenance", "資產管理": "Asset management", "能源管理": "Energy management",

  "土地評估與取得": "Assess and acquire land", "全市土地依條件篩選並評分": "Screen and score every lot in the city", "潛力地排行報告": "Ranked site report",
  "地主整合與談判": "Assemble owners and negotiate", "彙整地籍、權屬與周邊行情": "Gather cadastre, ownership and local prices", "整合評估資料包": "Assembly briefing pack",
  "開發可行性評估": "Feasibility study", "自動試算法規容積與量體": "Work out allowed floor area and massing", "可行性評估報告": "Feasibility report",
  "投資效益試算": "Return on investment", "依方案試算成本、售價與報酬": "Cost, price and return for each scheme", "投報試算表": "Return worksheet",
  "市場調查與產品定位": "Market study and positioning", "彙整區域行情、供給與機能": "Gather local prices, supply and amenities", "市場分析報告": "Market analysis report",
  "定價與銷售策略": "Pricing and sales strategy", "比對周邊個案與成交行情": "Compare nearby projects and sold prices", "定價建議表": "Pricing recommendation",
  "接待中心與廣告企劃": "Sales gallery and campaign", "用 3D 方案產生展示內容": "Turn the 3D scheme into showcase material", "可互動的 3D 方案網頁": "Interactive 3D scheme page",
  "銷售進度追蹤": "Sales tracking", "自動彙整來客與成交資料": "Gather visits and sales automatically", "銷售週報": "Weekly sales report",
  "法規與容積檢討": "Code and floor area review", "比對土地使用分區與法規條文": "Check zoning against the code, clause by clause", "法規檢討表": "Code review sheet",
  "量體配置方案": "Massing options", "依容積與退縮產生多個量體": "Generate massings from floor area and setbacks", "量體方案比較": "Massing comparison",
  "日照與景觀初評": "Early sun and view study", "模擬各方案的日照與陰影": "Simulate sun and shadow for each option", "環境初評圖": "Early environmental study",
  "建照申請規劃": "Permit planning", "整理送審文件與檢核項目": "Put together submission documents and checks", "送件檢核清單": "Submission checklist",
  "綠建築等級目標設定": "Set the green rating target", "依基地條件試算各指標得分": "Estimate each indicator's score for the site", "等級目標建議": "Rating target advice",
  "候選證書可行性評估": "Candidate certificate feasibility", "檢查各指標的達成條件": "Check what each indicator needs", "指標檢核表": "Indicator checklist",
  "日照與通風初步分析": "Early sun and ventilation study", "快速模擬日照與風場": "Quick sun and wind simulation", "環境分析報告": "Environmental analysis report",
  "節能策略建議": "Energy strategy", "比較外殼與設備方案的能耗": "Compare envelope and equipment options", "節能方案比較": "Energy option comparison",
  "開發成本估算": "Development cost estimate", "依量體與單價自動估算": "Estimate from massing and unit rates", "成本估算表": "Cost estimate",
  "融資與資金規劃": "Financing plan", "依時程試算資金需求": "Work out funding needs along the schedule", "資金需求時程表": "Funding schedule",
  "現金流與報酬分析": "Cash flow and return", "多情境試算現金流與報酬率": "Run cash flow and return for several scenarios", "財務試算報告": "Financial report",
  "風險與敏感度分析": "Risk and sensitivity", "變動售價、成本與利率重算": "Rerun with other prices, costs and rates", "敏感度分析表": "Sensitivity table",

  "建築設計與圖說": "Design and drawings", "檢查圖面與模型是否一致": "Check drawings against the model", "圖模一致性報告": "Drawing and model report",
  "法規檢討": "Code review", "逐條檢討退縮、高度與容積": "Review setbacks, height and floor area clause by clause",
  "建照與都審送件": "Permit and design review submission", "整理送審圖說與檢核項目": "Put together drawings and checks for submission",
  "各專業圖面整合": "Coordinate all disciplines", "整合建築、結構、機電模型": "Merge architecture, structure and MEP models", "整合模型與問題清單": "Merged model and issue list",
  "結構系統規劃": "Structural system", "比較不同結構系統的用量": "Compare quantities across systems", "結構方案比較": "Structural comparison",
  "結構計算與簽證": "Calculation and sign-off", "彙整計算書所需的模型資料": "Gather the model data the calculations need", "計算資料彙整": "Calculation data pack",
  "耐震設計檢討": "Seismic design review", "檢查構件配置與規範條件": "Check member layout against the code", "檢討紀錄表": "Review record",
  "結構與建築圖面核對": "Structure against architecture", "自動比對梁柱與建築圖": "Compare beams and columns with the drawings", "不一致清單": "Mismatch list",
  "機電系統設計": "MEP system design", "依空間需求估算設備容量": "Size equipment from what each space needs", "設備容量試算": "Equipment sizing",
  "管線空間協調": "Services coordination", "偵測管線與結構的衝突": "Find clashes between services and structure", "衝突檢查報告": "Clash report",
  "機房與管道間配置": "Plant rooms and shafts", "檢查淨高與維修空間": "Check clear height and maintenance space", "空間檢核表": "Space checklist",
  "設備數量統計": "Equipment count", "從模型自動產出數量": "Take quantities straight from the model", "設備數量表": "Equipment schedule",
  "訂定 BEP 與 EIR": "Set the BEP and EIR", "依 ISO 19650 產生文件並檢查缺漏": "Draft to ISO 19650 and check for gaps", "BEP／EIR 文件": "BEP and EIR documents",
  "模型整合與衝突檢討": "Model federation and clashes", "自動跑衝突檢查並分類": "Run clash checks and sort the results",
  "模型品質查核": "Model quality check", "檢查命名、屬性與建模標準": "Check naming, properties and modelling standard", "模型查核報告": "Model audit report",
  "數量產出": "Quantity take-off", "從模型產出數量並對照圖面": "Take quantities from the model and check the drawings", "數量概算表": "Quantity estimate",
  "外殼節能與能效計算": "Envelope and energy calculation", "從模型讀取外殼資料計算": "Calculate from the model's envelope data", "能效計算書": "Energy calculation",
  "日照與風場模擬": "Sun and wind simulation", "比較各方案的陰影與通風": "Compare shadow and ventilation across options", "方案比較報告": "Option comparison report",
  "綠建築指標檢討": "Green indicator review", "逐項檢查指標得分": "Check each indicator's score",
  "候選證書送審": "Candidate certificate submission", "整理送審所需文件": "Put together the submission documents", "送審文件包": "Submission pack",

  "施工計畫與預算": "Construction plan and budget", "從模型產出數量與預算基準": "Quantities and a budget baseline from the model", "預算基準表": "Budget baseline",
  "進度控管": "Schedule control", "比對計畫與實際進度": "Compare planned and actual progress", "進度報告": "Progress report",
  "成本控管": "Cost control", "依完成比例試算成本": "Work out cost from percentage complete", "成本追蹤表": "Cost tracker",
  "業主與協力廠商協調": "Client and subcontractor coordination", "彙整待辦與審查意見": "Gather open items and review comments", "會議追蹤清單": "Meeting follow-up list",
  "現場施工調度": "Site scheduling", "依進度排出近期工項": "Lay out the coming work from the schedule", "三週滾動計畫": "Three-week look-ahead",
  "人機料每日安排": "Daily labour, plant and materials", "依工項估算人力與材料": "Estimate labour and materials for each activity", "每日需求表": "Daily requirements",
  "施工日誌": "Site diary", "自動整理當日紀錄與照片": "Put the day's records and photos in order",
  "工地問題回報": "Site issue reporting", "把問題標在模型位置上": "Pin each issue to its place in the model", "問題追蹤清單": "Issue tracker",
  "施工品質查驗": "Quality inspection", "用現場掃描比對模型": "Compare site scans with the model", "品質報告": "Quality report",
  "材料與設備審查": "Material and equipment review", "比對送審資料與規範": "Check submittals against the specification", "審查意見表": "Review comments",
  "估驗計價審核": "Payment certification", "依完成比例核對計價": "Check the valuation against percentage complete", "計價審核表": "Valuation review",
  "審查意見回覆追蹤": "Comment response tracking", "整理意見與回覆狀態": "Track comments and their replies", "審查追蹤表": "Review tracker",
  "品質計畫與自主檢查": "Quality plan and self-inspection", "依工項產生檢查表": "Generate checklists for each activity", "自主檢查表": "Self-inspection checklist",
  "缺失改善追蹤": "Defect follow-up", "把缺失對到位置並追蹤": "Tie each defect to its location and track it", "缺失追蹤清單": "Defect tracker",
  "職安衛巡檢": "Safety patrol", "彙整巡檢紀錄與照片": "Gather patrol records and photos", "巡檢報告": "Patrol report",
  "施工偏差檢查": "Deviation check", "掃描比對找出偏移位置": "Find what is out of place by scan", "偏差標示圖": "Deviation map",
  "分包發包與比價": "Tendering and comparison", "從模型產出發包數量": "Tender quantities from the model", "發包數量表": "Tender quantities",
  "材料採購與交期": "Purchasing and lead times", "依進度推算到料時間": "Work back delivery dates from the schedule", "採購時程表": "Purchasing schedule",
  "合約與變更管理": "Contracts and variations", "比對變更前後的數量差異": "Compare quantities before and after a change", "變更數量比較": "Variation comparison",
  "計價與請款": "Valuation and payment", "依完成比例試算本期計價": "Work out this period's valuation", "計價報告": "Valuation report",

  "住戶與租戶服務": "Resident and tenant service", "彙整報修與服務紀錄": "Gather repair requests and service records", "服務紀錄報表": "Service record report",
  "日常管理": "Day-to-day management", "排出巡檢與清潔保全工作": "Schedule patrols, cleaning and security", "例行工作排程": "Routine work schedule",
  "管理費與修繕基金": "Fees and repair fund", "依修繕計畫試算基金需求": "Work out the fund the repair plan needs", "基金試算表": "Fund worksheet",
  "管理報告": "Management report", "自動彙整每月營運資料": "Gather each month's operating data", "物業管理報表": "Property management report",
  "設備定期保養": "Planned maintenance", "依使用年限與紀錄排程": "Schedule by service life and records", "維護排程": "Maintenance schedule",
  "故障叫修處理": "Breakdown calls", "把設備對到建築裡的位置": "Tie each asset to its place in the building", "設備定位與履歷": "Asset location and history",
  "設備履歷管理": "Asset history", "從竣工資料建立履歷": "Build histories from handover data", "設備履歷": "Asset history",
  "備品管理": "Spare parts", "依維修紀錄估算備品需求": "Estimate spares from repair records", "備品清單": "Spare parts list",
  "長期修繕計畫": "Long-term repair plan", "依風險與成本排優先順序": "Rank by risk and cost",
  "營運成本與預算": "Operating cost and budget", "彙整歷年支出並預估": "Gather past spending and forecast", "年度預算建議": "Annual budget advice",
  "資產更新評估": "Renewal assessment", "比較維修與更新的成本": "Compare repair with replacement", "更新評估報告": "Renewal report",
  "竣工資料管理": "Handover records", "整理竣工圖說與文件": "Put handover drawings and documents in order", "可查詢的資產資料": "Searchable asset records",
  "能耗監測與分析": "Energy monitoring", "彙整各系統的用電資料": "Gather each system's consumption", "能耗分析報告": "Energy analysis report",
  "節能改善方案": "Energy improvements", "比較改善方案的效益": "Compare what each improvement saves",
  "建築能效申報": "Energy performance filing", "整理申報所需資料": "Put together the filing data", "申報資料包": "Filing pack",
  "設備運轉最佳化": "Operation tuning", "找出異常耗能的設備": "Find equipment using more than it should", "異常設備清單": "Flagged equipment list"
};
