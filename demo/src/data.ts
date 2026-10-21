export const profile = {
  name: "石小咕",
  motto: "月球很大，慢慢走。",
  location: "月球后院 · 虚构住址",
  birthday: "08月16日",
  interests: "捡石头 / 种花 / 听老歌",
};
export const diaries = [
  {
    id: "summer",
    title: "今天的石头有点像土豆",
    date: "2007-08-18",
    category: "小日子",
    text: "今天往东走了十九步，发现一块很像土豆的石头。\n想带回洞里，又觉得它在这里晒太阳也挺好。于是给它起了个名字：小土。",
    more: "傍晚回到洞口，给花浇了水。月球上没有风，叶子却好像朝我挥了挥。明天再去看小土。",
    reads: 28,
    comments: 3,
  },
  {
    id: "cloud",
    title: "给月球种一朵花",
    date: "2007-08-15",
    category: "碎碎念",
    text: "把种子埋进月球土里。\n等了好一会儿，冒出一根歪歪的小芽。它大概也在适应低重力。",
    more: "欢迎来给它浇花。四种照料都试试，说不定会开花。",
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
    title: "月球散步",
    subtitle: "2007.08 · 第一次探险",
    image: "/assets/moon-walk.svg",
    alt: "月球旗和脚印的原创简笔画",
    count: 1,
  },
  {
    id: "lane",
    title: "石头收藏",
    subtitle: "2007.07 · 洞外写生",
    image: "/assets/moon-rocks.svg",
    alt: "两块奇怪石头的原创简笔画",
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
    text: "踩一脚～给花浇过水啦！小土今天还好吗？",
    date: "2007-08-18 16:32",
  },
  {
    id: "m2",
    sample: true,
    name: "风里的信",
    text: "土星挂件有点歪，不过这样才像你的空间。",
    date: "2007-08-17 20:16",
  },
];
