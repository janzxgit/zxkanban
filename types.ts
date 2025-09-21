export interface QuickLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface TripReport {
  content: string;
  achievements: string;
  issues: string;
  expenses: number;
}

export interface BusinessTrip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'Planned' | 'Completed';
  report?: TripReport;
}

export interface Collaboration {
    id: string;
    '引合番号': string;
    '担当': string;
    '地域': string;
    '代理': string;
    '機種': string;
    '台数': string;
    '顧客情報': string;
    '案件発生年月': string;
    '访问方式': string;
    '訪問回数': string;
    '確度': string;
    '確度変更': string;
    '確度変更理由': string;
    '出荷可能時期': string;
    '最終結果': string;
    '出荷日(実際）': string;
    '備考①引合詳細、補充内容': string;
    '備考②引合状況変化記録等': string;
    '備考③': string;
}

export interface Personnel {
  id: string;
  name: string;
  position: string;
  area: string[];
  birthdate: string;
}

export interface Agent {
  id: string;
  'SS担当': string;
  '代理区域': string;
  '代理商': string;
  '联系人': string;
  '电话': string;
  '公司地址': string;
  '合同日期': string;
  '代理状态': '合作中' | '已终止';
  '备考': string;
}

export interface Product {
  id: string;
  '機種': string;
  '区分': string;
  '代理価格': string;
  '仕切り価格': string;
  'オプション': string;
  '備考': string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string;
  minutes: string;
}

export interface Contract {
    id: string;
    '担当': string;
    '機種': string;
    '区分': string;
    '機号': string;
    '契約日': string;
    '代理名称': string;
    '契約状態': string;
    '契約書NO': string;
    '出荷指示書№': string;
    '契約日付': string;
    '単価': string;
    '台数': string;
    '割賦時間': string;
    '備考①': string;
    '備考②': string;
}