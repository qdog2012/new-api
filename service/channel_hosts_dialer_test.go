/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

package service

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestChannelHostsMapOverridesDialAddress(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, "ok:"+r.Host)
	}))
	defer server.Close()

	serverURL, err := url.Parse(server.URL)
	require.NoError(t, err)

	// .invalid never resolves, so a successful request proves the dial override.
	client, err := GetHttpClientWithProxySettings("", dto.ChannelSettings{
		HostsMap: "upstream.invalid " + serverURL.Hostname(),
	})
	require.NoError(t, err)
	t.Cleanup(ResetProxyClientCache)

	resp, err := client.Get("http://upstream.invalid:" + serverURL.Port() + "/ping")
	require.NoError(t, err)
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	// Host header keeps the configured hostname, only the dial target changes.
	assert.Equal(t, "ok:upstream.invalid:"+serverURL.Port(), string(body))
}

func TestNormalizeHTTPTransportPolicyHostsMap(t *testing.T) {
	invalid := NormalizeHTTPTransportPolicy(dto.ChannelSettings{HostsMap: "not-a-hosts-entry"})
	assert.Empty(t, invalid.HostsKey, "unparsable mappings must fall back to system DNS")

	first := NormalizeHTTPTransportPolicy(dto.ChannelSettings{HostsMap: "10.0.0.1 api.example.com"})
	second := NormalizeHTTPTransportPolicy(dto.ChannelSettings{HostsMap: "10.0.0.2 api.example.com"})
	assert.NotEmpty(t, first.HostsKey)
	assert.NotEqual(t, first.cacheKeyPart(), second.cacheKeyPart(), "different mappings need distinct cached transports")

	assert.Equal(
		t,
		defaultHTTPTransportPolicy(),
		NormalizeHTTPTransportPolicy(dto.ChannelSettings{}),
		"empty hosts map keeps the default policy comparable",
	)
}
