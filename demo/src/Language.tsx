import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Language = "en" | "zh";

// Chinese source copy is retained as the lookup key for the original skin.
// Unknown strings pass through, including user-authored guestbook content.
const english: Record<string, string> = {
  晴空小站: "Blue Sky Corner",
  一页旧时光: "A page from the old days",
  留言给小屿: "Leave a hello",
  "虚构空间 · DEMO": "FICTIONAL SPACE · DEMO",
  "夏天慢慢走，我们慢慢说。": "Slow summer days. A little more time to talk.",
  "有风经过的地方，就有好心情。": "A little breeze, a little happiness.",
  空间导航: "Space navigation",
  主页: "Home",
  日志: "Diary",
  相册: "Albums",
  见面: "Meet up",
  音乐: "Music",
  留言板: "Guestbook",
  个人档: "Profile",
  欢迎光临我的空间: "Welcome to my little space",
  "小站公告：把快乐存进这里，也把晴天分你一点。":
    "Notice: saving little happy things here. Sharing a little sunshine with you.",
  "2007.08.18 晴": "2007.08.18 · Sunny",
  小站足迹: "Visitors",
  你是这里的第: "You are visitor number",
  "样本访问次数 1286": "Sample visit count: 1286",
  "位过客。谢谢你的停留。": "Thanks for stopping by.",
  "装饰计数器 · 样本数据": "Decorative counter · sample data",
  "“愿每次路过，": "“May every little visit",
  "都能遇见一点小小的快乐。”": "bring a little happiness.”",
  回到顶部: "Back to top",
  "晴空小站 · 留住一点夏天": "Blue Sky Corner · keeping a little summer",
  "2005–2008 Qzone 风格练习 · 全部人物、图片与内容均为虚构演示":
    "Inspired by 2005–2008 Qzone · all people, images and content are fictional demo material",
  林小屿: "Jamie Lin",
  "把日子过成蓝色的。": "Collecting blue-sky days.",
  "晴川 · 虚构小城": "Clearwater · fictional town",
  "08月16日": "August 16",
  "散步 / 拍照 / 听老歌": "Walks / photos / old songs",
  "窗边的白色陶瓷兔子，虚构主人公的头像":
    "A white ceramic rabbit by a window, the fictional owner's avatar",
  在线: "Online",
  现居: "From",
  生日: "Birthday",
  喜欢: "Likes",
  "一个喜欢收集晴天的人。": "Someone who likes collecting sunny days.",
  "欢迎来我的小小空间坐坐。": "Stay a while in my little corner.",
  给我留言: "Leave me a message",
  心情: "Mood",
  晴: "Sunny",
  我的日志: "My diary",
  "共 2 篇": "2 entries",
  "今天也有好好地看看天空。": "Made a little time to look at the sky today.",
  "分类：": "Filed under: ",
  阅读全文: "Read more",
  收起日志: "Read less",
  "阅读(": "Views (",
  ") · 评论(": ") · Comments (",
  示例: "sample",
  夏天慢慢走: "Summer, take your time",
  小日子: "Little days",
  "午后的风把窗帘吹得鼓鼓的，像一艘准备出发的小船。\n收拾抽屉的时候，翻到了去年夏天的车票。原来那些以为忘记的小事，都有好好地留在某个地方。":
    "The afternoon breeze filled the curtains like the sails of a tiny boat.\nWhile tidying a drawer, I found a ticket from last summer. Those little things I thought I'd forgotten were waiting somewhere all along.",
  "傍晚去了河边，买了一瓶冰汽水。坐着看了很久的云，什么也没做，觉得这样也很好。希望下次见面的时候，我们都还有好多小事可以分享。":
    "In the evening I went down to the river and bought a cold soda. I sat watching clouds for ages, doing nothing at all. That felt good too. I hope we'll have lots of little stories to share next time we meet.",
  今天捡到一朵云: "Found a cloud today",
  碎碎念: "Small thoughts",
  "回家的路上抬头，看到一朵很像兔子的云。\n于是绕了一点远路，陪它走到了路口。":
    "On the way home I spotted a cloud shaped like a rabbit.\nSo I took the long way and kept it company until the crossroads.",
  "相机没有带在身上，就把它记在这里吧。也许明天会遇到一朵长得像鲸鱼的云。":
    "I'd left my camera at home, so I'll save it here in words. Maybe tomorrow I'll find a cloud that looks like a whale.",
  有空见个面: "Let's meet",
  虚构安排: "Sample plans",
  筛选见面安排: "Filter meetup plans",
  全部: "All",
  已确定: "Confirmed",
  还在想: "Maybe",
  日期: "Date",
  筛选日期: "Filter by date",
  全部日期: "All dates",
  周六: "Sat",
  周日: "Sun",
  "河边散步，顺便喝汽水": "Riverside walk & a soda",
  旧书店淘书: "Browse the old bookshop",
  "这一天没有符合筛选的安排。换个筛选看看吧。":
    "No plans match this date and filter. Try another combination.",
  "示例时间线：2007年8月18日 · 中国标准时间 UTC+8":
    "Sample timeline: August 18, 2007 · China Standard Time, UTC+8",
  我的相册: "Photo albums",
  "2 本相册": "2 albums",
  "打开相册：": "Open album: ",
  关闭相册: "Close album",
  张: " photo",
  "原创生成图片 · 虚构相册": "Original generated image · fictional album",
  去看海吧: "Let's see the sea",
  "2007.08 · 夏日出走": "August 2007 · a summer escape",
  蓝色海岸与白色浪花的原创虚构旅行照片:
    "Original fictional travel photo of a blue coast and white surf",
  路过的小风景: "Little sights along the way",
  "2007.07 · 慢慢散步": "July 2007 · slow walks",
  绿树与蓝色自行车的原创虚构小巷照片:
    "Original fictional photo of a leafy lane and blue bicycle",
  音乐盒: "Music box",
  夏日海岸唱片封面: "Summer coast album cover",
  正在收藏的旋律: "A tune to keep",
  晴天的来信: "A letter from the sunshine",
  小屿的八音盒: "Jamie's music box",
  音乐暂时无法载入: "Unable to load this track",
  "正在播放…": "Playing…",
  播放完毕: "Track finished",
  "已暂停 · 点击播放": "Paused · press play",
  播放进度: "Playback position",
  暂停音乐: "Pause music",
  播放音乐: "Play music",
  暂停: "Pause",
  播放: "Play",
  停止: "Stop",
  音量: "Volume",
  "原创演示旋律 · 24秒 · 不自动播放":
    "Original demo tune · 24 sec · no autoplay",
  "请填写昵称和留言内容。": "Please enter a name and a message.",
  "本次演示 · 刚刚": "This demo · just now",
  "留言已添加到本页。仅本地演示，刷新后重置。":
    "Message added to this page. Local demo only; refresh to reset.",
  本地演示: "Local demo",
  "来过，就留下一点点声音吧。": "You were here. Leave a little hello.",
  你的昵称: "Your name",
  给自己起个名字: "Pick a name",
  留言内容: "Your message",
  "今天的心情是什么颜色？": "What color is your mood today?",
  "/300 · 刷新后重置": "/300 · resets on refresh",
  发表留言: "Post message",
  留言列表: "Guestbook messages",
  楼: " · post",
  "留言只保存在当前页面，不会发送到服务器。":
    "Messages stay on this page and are never sent to a server.",
  苏打泡泡: "Soda Pop",
  "来踩踩～蓝色的新皮肤好好看！下次一起去看海呀。":
    "Dropping by! Love the new blue skin. Let's see the sea together next time.",
  风里的信: "Airmail",
  "慢慢走，也要记得常常更新。送你一整个晴天。":
    "Take your time, but keep posting. Sending you a whole sunny day.",
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (source: string) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const t = (source: string) =>
    language === "en" ? (english[source] ?? source) : source;

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title =
      language === "en"
        ? "Blue Sky Corner · Summer, take your time"
        : "晴空小站 · 夏天慢慢走";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        language === "en"
          ? "A fictional summer homepage inspired by early Qzone. Local demo."
          : "晴空小站，一页关于夏天的虚构旧时光。Qzone 风格本地演示。",
      );
  }, [language]);

  return (
    <LanguageContext value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage requires LanguageProvider");
  return context;
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switch" role="group" aria-label="Language / 语言">
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        English
      </button>
      <button
        type="button"
        lang="zh-CN"
        aria-pressed={language === "zh"}
        onClick={() => setLanguage("zh")}
      >
        中文
      </button>
    </div>
  );
}
