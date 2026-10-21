export const profile = {
  name: "林小屿",
  motto: "把日子过成蓝色的。",
  location: "晴川 · 虚构小城",
  birthday: "08月16日",
  interests: "散步 / 拍照 / 听老歌",
};
export const diaries = [
  {
    id: "summer",
    title: "夏天慢慢走",
    date: "2007-08-18",
    category: "小日子",
    text: "午后的风把窗帘吹得鼓鼓的，像一艘准备出发的小船。\n收拾抽屉的时候，翻到了去年夏天的车票。原来那些以为忘记的小事，都有好好地留在某个地方。",
    more: "傍晚去了河边，买了一瓶冰汽水。坐着看了很久的云，什么也没做，觉得这样也很好。希望下次见面的时候，我们都还有好多小事可以分享。",
    reads: 28,
    comments: 3,
  },
  {
    id: "cloud",
    title: "今天捡到一朵云",
    date: "2007-08-15",
    category: "碎碎念",
    text: "回家的路上抬头，看到一朵很像兔子的云。\n于是绕了一点远路，陪它走到了路口。",
    more: "相机没有带在身上，就把它记在这里吧。也许明天会遇到一朵长得像鲸鱼的云。",
    reads: 16,
    comments: 2,
  },
];
export type Availability = {
  id: string;
  day: string;
  weekday: string;
  time: string;
  place: string;
  status: "confirmed" | "tentative";
};
export const availability: Availability[] = [
  {
    id: "a",
    day: "08.25",
    weekday: "周六",
    time: "14:00—17:00",
    place: "河边散步，顺便喝汽水",
    status: "confirmed",
  },
  {
    id: "b",
    day: "08.26",
    weekday: "周日",
    time: "10:00—12:00",
    place: "旧书店淘书",
    status: "tentative",
  },
];
export type Album = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  count: number;
};
export const albums: Album[] = [
  {
    id: "sea",
    title: "去看海吧",
    subtitle: "2007.08 · 夏日出走",
    image: "/assets/coast.jpg",
    alt: "蓝色海岸与白色浪花的原创虚构旅行照片",
    count: 1,
  },
  {
    id: "lane",
    title: "路过的小风景",
    subtitle: "2007.07 · 慢慢散步",
    image: "/assets/street.jpg",
    alt: "绿树与蓝色自行车的原创虚构小巷照片",
    count: 1,
  },
];
export type Message = {
  id: string;
  name: string;
  text: string;
  date: string;
  sample?: boolean;
};
export const messages: Message[] = [
  {
    id: "m1",
    sample: true,
    name: "苏打泡泡",
    text: "来踩踩～蓝色的新皮肤好好看！下次一起去看海呀。",
    date: "2007-08-18 16:32",
  },
  {
    id: "m2",
    sample: true,
    name: "风里的信",
    text: "慢慢走，也要记得常常更新。送你一整个晴天。",
    date: "2007-08-17 20:16",
  },
];
