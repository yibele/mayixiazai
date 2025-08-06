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



文案获取
```
curl -X POST 'https://api.coze.cn/v1/workflow/run' \
-H "Authorization: Bearer sat_jqCvnpl4QKQc2NoeWNY8RHYc7rhxJs5dQOZUDg0yFk13vnkCZRUIxqQMvqSWlgLz" \
-H "Content-Type: application/json" \
-d '{
  "workflow_id": "7535294053631819826",
  "parameters": {
    "input": "https://www.bilibili.com/video/BV1XRgNzjEF7/?spm_id_from=333.1007.tianma.5-1-15.click&vd_source=96959ec2796e251a9b09de20bc497636"
  },
  "is_async": true
}'
```
返回内容
```
{"code":0,"debug_url":"https://www.coze.cn/work_flow?execute_id=7535298640308535332&space_id=7476805188205182986&workflow_id=7535294053631819826&execute_mode=2","execute_id":"7535298640308535332","msg":"Success"}
```
异步查询结果
```
curl -X GET 'https://api.coze.cn/v1/workflows/7535294053631819826/run_histories/7535298640308535332' \
-H "Authorization: Bearer cztei_lYyUYPte5pGVCXvqyR3c5UG0wbqs07s40QwGYEMjiuPyTXOjgDfgonPMthrFOhotC" \
-H "Content-Type: application/json"
```
异步查询返回结果
```
{"msg":"","data":[{"connector_uid":"1519962369294395","logid":"20250806104715BA070BFC777692AA724C","bot_id":"0","update_time":1754448466,"execute_status":"Success","error_code":"0","connector_id":"1024","is_output_trimmed":false,"token":"0","run_mode":2,"debug_url":"https://www.coze.cn/work_flow?execute_id=7535298640308535332&space_id=7476805188205182986&workflow_id=7535294053631819826&execute_mode=2","node_execute_status":{},"error_message":"","execute_id":"7535298640308535332","create_time":1754448435,"output":"{\"node_status\":\"{}\",\"Output\":\"{\\\"content\\\":\\\"你好，大家现在是 7月17号 啊，韩国时间六点五十三分，那韩国时间六点五十三分的话，中国时间就五点五十三分了。下午，然后现在我这个以 Tab 单词是前天进场的那个视频中，前天的那个视频我说过，然后我那我这个单子是前天进场的，现在在400 400% 盈利中，我进的总金额是100万美金。然后我这个是仔细地说一下，我这个是在这个横盘整理的底部进场啊，我们现在这个围绕着这个横盘帧，还有这个趋势线，现在完全把这个主机线突破了，然后我说过，这个突破这一些主力线的时候是根本不会给机会的，然后突破，突破这里又突破，我感觉啊不是感觉，我感觉很大的可能性这些主题线直接给突破，我感觉现在以太币啊，疯狂上涨，哦对了，所以我想说的是这个，我想说的是我现在不是赚400万美金吗？个人给100万美金啊，不是100万，我他搜错了，1万美金，一个人给1万美金啊，因为总那一个人给1万美金的话，总共也不是才3万嘛，那就才我现在赚400万，那就是 3/400， 根本根本根本不是一个大钱，所以我想抽三个人，所以你们可以把那些钱包地址发那我就随机发吧，但是那个关注一下就可以了，随机发，充3个人，那就这样了。\\\",\\\"title\\\":\\\"以太币100万美金交易实盘 7/17\\\"}\"}","usage":{"token_count":0,"output_count":0,"input_count":0}}],"detail":{"logid":"202508061050119BE34DBA477B4261BA8F"},"code":0}
```