# cozeAPI说明

视频下载curl
```
curl -X POST 'https://api.coze.cn/v1/workflow/run' \
-H "Authorization: Bearer sat_jqCvnpl4QKQc2NoeWNY8RHYc7rhxJs5dQOZUDg0yFk13vnkCZRUIxqQMvqSWlgLz" \
-H "Content-Type: application/json" \
-d '{
  "workflow_id": "7535017326866415642",
  "parameters": {
    "input": "6.15 03/10 goD:/ g@B.tE 克洛克达尔女性身份的秘密 # 海贼王动画 # 航海王入驻抖音 # 要相信海米的羁绊 # 动漫编年史 # 午夜屠虎男 @航海王_ONEPIECE官方  https://v.douyin.com/fEAkiIPyAd4/ 复制此链接，打开Dou音搜索，直接观看视频！"
  },
  "is_async": false
}'
```

视频下载返回数据：
```
   {"code":0,"data":"{\"avatar\":\"https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_96b0665b3f3641d0b758f6efe71246ac.jpeg?from=327834062\",\"cover_url\":\"https://v5-se-qn-daily-cm-cold.douyinvod.com/7431e7f94360f08eddb39d5f01d1f67b/6891d8bd/video/tos/cn/tos-cn-ve-15c000-ce/oIALgeIweCAili5PqoeT7RPs16BZECUEUQd0vP/?a=1128&ch=0&cr=0&dr=0&cd=0%7C0%7C0%7C0&cv=1&br=1117&bt=1117&cs=0&ds=3&ft=rVQ6egwwZRcBsCDo1PDS6kFgAX1tG~x_yu9eF~IzMpV12nzXT&mime_type=video_mp4&qs=0&rc=OzQ7O2hpNGUzZzc6M2loOkBpam1ndXU5cnhtNTMzbGkzNEBiMy0xY2MyXjAxMS5jLTQyYSNmNS5rMmQ0bjRhLS1kLWJzcw%3D%3D&btag=80010e000a8000&cquery=100y&dy_q=1754384917&feature_id=fea919893f650a8c49286568590446ef&l=202508051708378F8866DD1532A9D84408\",\"nickname\":\"午夜屠虎男\",\"output\":\"https://p9-sign.douyinpic.com/tos-cn-i-0813c000-ce/oIAshPAvApiiEhLA8PbntwiCI9PPIaC7ADBM9~tplv-dy-resize-walign-adapt-aq:540:q75.webp?lk3s=138a59ce&x-expires=1755594000&x-signature=yT9Iejh%2FhYoh4NCtvmPgUOyFGfU%3D&from=327834062&s=PackSourceEnum_DOUYIN_REFLOW&se=false&sc=cover&biz_tag=aweme_video&l=20250805170836104DA555B10069BCDACD\",\"title\":\"克洛克达尔女性身份的秘密 #海贼王动画 #航海王入驻抖音 #要相信海米的羁绊 #动漫编年史 #午夜屠虎男 @航海王_ONEPIECE官方\"}","debug_url":"https://www.coze.cn/work_flow?execute_id=7535025835545116698&space_id=7476805188205182986&workflow_id=7535017326866415642&execute_mode=2","msg":"Success","usage":{"input_count":0,"output_count":0,"token_count":0}}
```