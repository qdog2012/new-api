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
	"context"
	"net"
	"net/http"
	"strings"
	"time"
)

// applyChannelHostsDialer makes a transport connect to fixed IPs for the
// hostnames a channel maps, while the Host header and TLS SNI keep the original
// hostname (net/http derives both from the request URL, not from the dialed
// address). It must run after proxy configuration: with an HTTP/SOCKS proxy the
// dialer connects to the proxy, so upstream host overrides cannot apply.
func applyChannelHostsDialer(transport *http.Transport, hosts map[string]string) {
	if transport == nil || len(hosts) == 0 {
		return
	}
	baseDial := transport.DialContext
	if baseDial == nil {
		dialer := &net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}
		baseDial = dialer.DialContext
	}
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		if host, port, err := net.SplitHostPort(addr); err == nil {
			if ip, ok := hosts[strings.ToLower(host)]; ok {
				addr = net.JoinHostPort(ip, port)
			}
		}
		return baseDial(ctx, network, addr)
	}
}
