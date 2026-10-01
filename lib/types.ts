export type Prospect = {
  id: string;
  place_id: string | null;
  name: string;
  category: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  reviews: number;
  rating: number | null;
  web_status: string;
  website: string | null;
  maps_url: string | null;
  owner: string | null;
  stage: string;
  touches: number;
  first_contact: string | null;
  last_contact: string | null;
  next_follow_up: string | null;
  amount_usd: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  wa_sent_at: string | null;
  wa_result: string | null;
  call_at: string | null;
  call_result: string | null;
  email_sent_at: string | null;
  email_result: string | null;
  tags: string[];
};

export type Activity = {
  id: string;
  prospect_id: string;
  kind: string;
  template: string | null;
  detail: string | null;
  author: string | null;
  day: string;
  created_at: string;
};

export type EventRow = {
  id: string;
  prospect_id: string | null;
  title: string;
  day: string;
  time: string | null;
  kind: string;
  owner: string | null;
  done: boolean;
};

export type Template = {
  code: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  counts_touch: boolean;
  sort: number;
};

export type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  web_status: "sin_web" | "solo_redes" | "con_web";
  rating: number | null;
  reviews: number;
  maps_url: string | null;
  tipo: string | null;
  rubro: string;
  ya_registrado: boolean;
};
