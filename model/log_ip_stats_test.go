package model

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestGetIpTokenStatsGroupsConsumptionByIp(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	previousLogDB := LOG_DB
	LOG_DB = db
	t.Cleanup(func() { LOG_DB = previousLogDB })

	require.NoError(t, db.AutoMigrate(&Log{}))

	rows := []Log{
		{Type: LogTypeConsume, Ip: "1.1.1.1", PromptTokens: 10, CompletionTokens: 5, CreatedAt: 100},
		{Type: LogTypeConsume, Ip: "1.1.1.1", PromptTokens: 1, CompletionTokens: 2, CreatedAt: 200},
		{Type: LogTypeConsume, Ip: "2.2.2.2", PromptTokens: 7, CompletionTokens: 3, CreatedAt: 300},
		{Type: LogTypeConsume, Ip: "", PromptTokens: 100, CompletionTokens: 100, CreatedAt: 400},
		{Type: LogTypeError, Ip: "3.3.3.3", PromptTokens: 50, CompletionTokens: 50, CreatedAt: 500},
	}
	for i := range rows {
		require.NoError(t, db.Create(&rows[i]).Error)
	}

	stats, err := GetIpTokenStats(0, 0, 10)
	require.NoError(t, err)
	require.Len(t, stats, 2)

	assert.Equal(t, "1.1.1.1", stats[0].Ip)
	assert.Equal(t, int64(11), stats[0].PromptTokens)
	assert.Equal(t, int64(7), stats[0].CompletionTokens)
	assert.Equal(t, int64(18), stats[0].TotalTokens)
	assert.Equal(t, int64(2), stats[0].Count)

	assert.Equal(t, "2.2.2.2", stats[1].Ip)
	assert.Equal(t, int64(10), stats[1].TotalTokens)
}
