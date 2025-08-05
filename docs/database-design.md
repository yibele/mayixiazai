# 蚂蚁下载 - 数据库设计文档

## 1. 用户表 (users)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| openid | string | 是 | - | 微信用户唯一标识 |
| nickname | string | 否 | - | 用户昵称（如果授权获取） |
| avatar_url | string | 否 | - | 用户头像（如果授权获取） |
| points | number | 是 | 0 | 积分余额 |
| daily_free_count | number | 是 | 0 | 今日已使用免费解析次数 |
| daily_free_limit | number | 是 | 10 | 每日免费解析次数限制 |
| total_parse_count | number | 是 | 0 | 累计解析次数 |
| created_at | Date | 是 | 当前时间 | 注册时间 |
| updated_at | Date | 是 | 当前时间 | 最后更新时间 |
| last_reset_date | string | 是 | 当前日期 | 上次重置免费次数的日期(YYYY-MM-DD) |

### 索引设计
- `openid`: 唯一索引
- `created_at`: 普通索引（用于统计）

## 2. 任务记录表 (user_tasks)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| user_id | ObjectId | 是 | - | 关联用户表的_id |
| openid | string | 是 | - | 微信用户标识（冗余字段，方便查询） |
| task_type | string | 是 | - | 任务类型：watch_ad(观看广告)、invite_friend(邀请好友) |
| points_earned | number | 是 | 0 | 本次任务获得的积分 |
| completed_at | Date | 是 | 当前时间 | 任务完成时间 |
| date | string | 是 | 当前日期 | 任务完成日期(YYYY-MM-DD) |
| extra_data | object | 否 | {} | 额外数据，如邀请好友时记录被邀请人openid |

### 索引设计
- `openid + task_type + date`: 复合索引（用于查询每日任务完成情况）
- `openid + completed_at`: 复合索引（用于查询任务历史）

## 3. 邀请关系表 (invitations)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| inviter_openid | string | 是 | - | 邀请人openid |
| invitee_openid | string | 是 | - | 被邀请人openid |
| invite_code | string | 否 | - | 邀请码（可选功能） |
| is_completed | boolean | 是 | false | 是否完成邀请（被邀请人是否使用过解析功能） |
| points_awarded | boolean | 是 | false | 是否已发放邀请奖励积分 |
| created_at | Date | 是 | 当前时间 | 邀请创建时间 |
| completed_at | Date | 否 | - | 邀请完成时间 |

### 索引设计
- `inviter_openid`: 普通索引
- `invitee_openid`: 唯一索引（一个用户只能被邀请一次）
- `invite_code`: 唯一索引（如果使用邀请码功能）

## 4. 解析记录表 (parse_records)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| user_id | ObjectId | 是 | - | 关联用户表的_id |
| openid | string | 是 | - | 微信用户标识 |
| original_url | string | 是 | - | 原始链接 |
| platform | string | 是 | - | 平台类型：douyin、kuaishou、xiaohongshu、bilibili |
| video_info | object | 否 | {} | 解析得到的视频信息 |
| is_success | boolean | 是 | false | 是否解析成功 |
| is_free | boolean | 是 | true | 是否使用免费次数 |
| points_cost | number | 是 | 0 | 消耗的积分数量 |
| created_at | Date | 是 | 当前时间 | 解析时间 |

### 索引设计
- `openid + created_at`: 复合索引（用于查询用户解析历史）
- `platform + created_at`: 复合索引（用于平台统计）

## 5. 批量分析记录表 (batch_analysis)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| user_id | ObjectId | 是 | - | 关联用户表的_id |
| openid | string | 是 | - | 微信用户标识 |
| profile_url | string | 是 | - | 主页链接 |
| platform | string | 是 | - | 平台类型 |
| total_videos | number | 是 | 0 | 分析到的视频总数 |
| downloaded_count | number | 是 | 0 | 用户下载的视频数量 |
| points_cost | number | 是 | 50 | 消耗的积分数量 |
| status | string | 是 | 'pending' | 状态：pending、processing、completed、failed |
| video_list | array | 否 | [] | 分析得到的视频列表 |
| created_at | Date | 是 | 当前时间 | 创建时间 |
| completed_at | Date | 否 | - | 完成时间 |

### 索引设计
- `openid + created_at`: 复合索引
- `status`: 普通索引（用于查询处理中的任务）

## 6. 系统配置表 (system_config)

### 表结构
| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| _id | ObjectId | 是 | - | 主键，系统自动生成 |
| config_key | string | 是 | - | 配置项键名 |
| config_value | object | 是 | {} | 配置值 |
| description | string | 否 | - | 配置说明 |
| updated_at | Date | 是 | 当前时间 | 更新时间 |

### 预设配置项
- `daily_free_limit`: 每日免费解析次数限制 (默认: 10)
- `ad_reward_points`: 观看广告奖励积分 (默认: 10)
- `ad_daily_limit`: 每日观看广告次数限制 (默认: 5)
- `invite_reward_points`: 邀请好友奖励积分 (默认: 20)
- `batch_analysis_cost`: 批量分析消耗积分 (默认: 50)
- `extra_parse_cost`: 超出免费次数后每次解析消耗积分 (默认: 10)

### 索引设计
- `config_key`: 唯一索引

## 7. 使用说明

### 数据库操作建议

1. **用户注册流程**：
   - 首次登录时，根据openid创建用户记录
   - 检查是否通过邀请链接注册，如是则创建邀请关系

2. **每日重置机制**：
   - 每次用户操作时检查`last_reset_date`
   - 如果不是今天，则重置`daily_free_count`为0，更新`last_reset_date`

3. **积分系统**：
   - 所有积分变动都要记录在`user_tasks`表中
   - 每次操作前都要校验用户积分余额

4. **性能优化**：
   - 合理使用索引，避免全表扫描
   - 定期清理过期的解析记录
   - 考虑使用缓存存储热点数据

### 云开发数据库权限设置

```javascript
// 用户表权限
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}

// 任务记录表权限
{
  "read": "auth.openid == doc.openid", 
  "write": false  // 只允许云函数写入
}

// 其他表类似设置...
```