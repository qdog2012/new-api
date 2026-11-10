package model

import (
	"github.com/QuantumNous/new-api/common"
)

type IpTokenStat struct {
	Ip               string `json:"ip"`
	PromptTokens     int64  `json:"prompt_tokens"`
	CompletionTokens int64  `json:"completion_tokens"`
	TotalTokens      int64  `json:"total_tokens"`
	Count            int64  `json:"count"`
}

const (
	defaultIpStatsLimit = 50
	maxIpStatsLimit     = 200
)

// GetIpTokenStats aggregates consumption logs by client IP. Only requests made
// while the user had "record request IP" enabled carry a non-empty ip field,
// so this covers just those users and time windows.
func GetIpTokenStats(startTimestamp, endTimestamp int64, limit int) ([]IpTokenStat, error) {
	if LOG_DB == nil {
		return nil, common.NewMessage("Log database is not initialized")
	}
	if limit <= 0 {
		limit = defaultIpStatsLimit
	}
	limit = min(limit, maxIpStatsLimit)

	stats := make([]IpTokenStat, 0)
	tx := LOG_DB.Table("logs").
		Select("ip, COALESCE(sum(prompt_tokens), 0) AS prompt_tokens, COALESCE(sum(completion_tokens), 0) AS completion_tokens, COALESCE(sum(prompt_tokens), 0) + COALESCE(sum(completion_tokens), 0) AS total_tokens, count(*) AS count").
		Where("type = ?", LogTypeConsume).
		Where("ip <> ?", "").
		Group("ip").
		Order("total_tokens DESC").
		Limit(limit)
	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if err := tx.Scan(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}
