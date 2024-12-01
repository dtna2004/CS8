class MapHandler {
    constructor() {
        this.map = L.map('map').setView([11.0, 110.0], 7);
        this.routeLayers = {};
        this.pointLayers = {};
        this.distanceLabels = [];
        this.pathLayer = null;
        this.bestPathLayer = null;
        this.routesVisible = true;
        this.pheromoneVisible = true;
        this.dashedRoutes = {};
        this.pheromoneLines = [];
        this.antPaths = [];
        this.iterationInfo = L.control({ position: 'bottomleft' });
        this.pheromoneInfo = L.control({ position: 'bottomright' });
        this.routeInfo = L.control({ position: 'topright' });
        this.antPathsInfo = L.control({ position: 'bottomleft' });
        this.bestPathInfo = L.control({ position: 'bottomleft' });
        this.topPathsLayers = [];
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.initializePoints();
        this.initializeRoutes();
        this.addInfoControls();
        this.addAcoInfoPanel();
    }

    initializePoints() {
        const bluePoints = ['UDOSI', 'OSIXA', 'SAMAP', 'SUDUN', 'VIMUT'];
        const redPoints = ['PANDI', 'ARESI'];
        const hiddenPoints = ['D18', 'D19', 'D20', 'D21', 'DX', 'DY', 'DZ', 'D05', 'D08', 'DN2'];

        Object.entries(POINTS).forEach(([name, point]) => {
            if (!hiddenPoints.includes(name)) {
                const marker = L.marker([point.lat, point.lng]).addTo(this.map);
                
                let labelClass = 'point-label';
                if (bluePoints.includes(name)) {
                    labelClass = 'blue-point';
                } else if (redPoints.includes(name)) {
                    labelClass = 'red-point';
                }
                
                marker.bindTooltip(name, {
                    permanent: true,
                    direction: 'top',
                    className: labelClass,
                    offset: [-15, 10]
                });
                
                this.pointLayers[name] = marker;
            }
        });
    }

    initializeRoutes() {
        Object.entries(ROUTES).forEach(([routeName, route]) => {
            const points = route.points.map(point => POINTS[point]);
            if (points.every(p => p)) {
                const polyline = L.polyline(
                    points.map(p => [p.lat, p.lng]),
                    {
                        color: route.color,
                        weight: 2,
                        opacity: this.routesVisible ? 0.8 : 0,
                        dashArray: route.dashArray || null
                    }
                ).addTo(this.map);
                this.routeLayers[routeName] = polyline;
                
                if (route.dashArray) {
                    this.dashedRoutes[routeName] = polyline;
                }
            }
        });

        // Vẽ đường biên giới
        const boundaryPoints = BOUNDARIES.map(point => POINTS[point]);
        if (boundaryPoints.every(p => p)) {
            const boundaryLine = L.polyline(
                boundaryPoints.map(p => [p.lat, p.lng]),
                {
                    color: '#000000',
                    weight: 3
                }
            ).addTo(this.map);
            this.routeLayers['boundary'] = boundaryLine;
        }
    }

    addInfoControls() {
        // Panel thông tin về vết mùi
        this.pheromoneInfo.onAdd = () => {
            const div = L.DomUtil.create('div', 'info-panel pheromone-info');
            div.innerHTML = `
                <div class="info-header">
                    <h4>Vết mùi</h4>
                    <div class="toggle-control">
                        <label>
                            <input type="checkbox" id="togglePheromone" ${this.pheromoneVisible ? 'checked' : ''}>
                            Hiển thị
                        </label>
                    </div>
                </div>
                <div id="iteration-info">Lần lặp: 0/0</div>
                <div class="pheromone-legend">
                    <div class="legend-item">
                        <div class="color-box" style="background: rgba(255,0,0,0.7)"></div>
                        <span>Mạnh</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: rgba(255,0,0,0.2)"></div>
                        <span>Yếu</span>
                    </div>
                </div>
            `;
            return div;
        };

        // Panel thông tin về đường bay
        this.routeInfo.onAdd = () => {
            const div = L.DomUtil.create('div', 'info-panel route-info');
            div.innerHTML = `
                <div class="info-header">
                    <h4>Đường bay</h4>
                    <div class="toggle-control">
                        <label>
                            <input type="checkbox" id="toggleRoutes" ${this.routesVisible ? 'checked' : ''}>
                            Hiển thị
                        </label>
                    </div>
                </div>
                <div class="route-legend">
                    <div class="legend-item">
                        <div class="line-box" style="background: #ff0000"></div>
                        <span>Đường bay chính</span>
                    </div>
                    <div class="legend-item">
                        <div class="line-box dashed" style="background: #00000f"></div>
                        <span>Đường bay phụ</span>
                    </div>
                </div>
            `;
            return div;
        };

        this.pheromoneInfo.addTo(this.map);
        this.routeInfo.addTo(this.map);

        // Thêm event listeners cho các nút toggle
        setTimeout(() => {
            document.getElementById('togglePheromone')?.addEventListener('change', (e) => {
                this.pheromoneVisible = e.target.checked;
                this.updatePheromoneVisibility();
            });

            document.getElementById('toggleRoutes')?.addEventListener('change', (e) => {
                this.routesVisible = e.target.checked;
                this.updateRoutesVisibility();
            });
        }, 0);
    }

    updatePheromoneVisibility() {
        const opacity = this.pheromoneVisible ? 1 : 0;
        this.pheromoneLines.forEach(line => {
            line.setStyle({ opacity: opacity });
        });
        document.querySelectorAll('.pheromone-value').forEach(el => {
            el.style.opacity = opacity;
        });
    }

    updateRoutesVisibility() {
        const opacity = this.routesVisible ? 0.8 : 0;
        Object.values(this.routeLayers).forEach(layer => {
            if (layer._map && layer !== this.routeLayers['boundary']) {
                layer.setStyle({ opacity: opacity });
            }
        });
    }

    clearHighlights() {
        if (this.pathLayer) {
            this.pathLayer.remove();
            this.pathLayer = null;
        }
        
        if (this.bestPathLayer) {
            if (Array.isArray(this.bestPathLayer)) {
                this.bestPathLayer.forEach(layer => layer.remove());
            } else {
                this.bestPathLayer.remove();
            }
            this.bestPathLayer = null;
        }
        
        this.topPathsLayers.forEach(layer => {
            if (Array.isArray(layer)) {
                layer.forEach(l => l.remove());
            } else {
                layer.remove();
            }
        });
        this.topPathsLayers = [];

        this.distanceLabels.forEach(label => label.remove());
        this.distanceLabels = [];
        
        Object.values(this.pointLayers).forEach(marker => {
            marker.setOpacity(1);
        });

        document.querySelectorAll('.pheromone-value').forEach(el => el.remove());
    }

    highlightPath(path, totalDistance) {
        this.clearHighlights();
        
        if (!path || path.length < 2) {
            console.error("Invalid path provided");
            return;
        }

        const uniquePath = path.filter((point, index) => 
            index === 0 || point !== path[index - 1]
        );

        const points = uniquePath.map(point => {
            const p = POINTS[point];
            if (!p) {
                console.error(`Point ${point} not found in POINTS`);
            }
            return p;
        }).filter(p => p);

        this.pathLayer = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FFD700',
                weight: 4,
                opacity: 0.8
            }
        ).addTo(this.map);

        for(let i = 0; i < points.length - 1; i++) {
            const distance = this.calculateDistance(points[i], points[i+1]);
            const midPoint = {
                lat: (points[i].lat + points[i+1].lat) / 2,
                lng: (points[i].lng + points[i+1].lng) / 2
            };
            
            const label = L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'distance-label'
            })
            .setContent(`${distance.toFixed(1)} km`)
            .setLatLng([midPoint.lat, midPoint.lng]);
            
            this.distanceLabels.push(label);
            label.addTo(this.map);
        }

        const pathResult = document.getElementById('pathResult');
        if (pathResult) {
            pathResult.innerHTML = `
                <div class="path-info">
                    <div class="path">Đường đi: ${uniquePath.join(' → ')}</div>
                    <div class="distance">Tổng khoảng cách: ${totalDistance.toFixed(1)} km</div>
                </div>
            `;
        }

        this.map.fitBounds(this.pathLayer.getBounds(), {
            padding: [50, 50]
        });
    }

    highlightSpecialPoints(start, end, via = null, mandatoryPoints = [], blockedPoints = []) {
        // Reset all markers to default first
        Object.values(this.pointLayers).forEach(marker => {
            marker.setIcon(L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                tooltipAnchor: [16, -28],
                shadowSize: [41, 41]
            }));
        });

        // Highlight start point
        const startMarker = this.pointLayers[start];
        if (startMarker) {
            startMarker.setIcon(L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            }));
        }
        
        // Highlight end point
        const endMarker = this.pointLayers[end];
        if (endMarker) {
            endMarker.setIcon(L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            }));
        }
        
        // Highlight via point
        if (via) {
            const viaMarker = this.pointLayers[via];
            if (viaMarker) {
                viaMarker.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                }));
            }
        }

        // Highlight mandatory points
        mandatoryPoints.forEach(point => {
            const marker = this.pointLayers[point];
            if (marker) {
                marker.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                }));
            }
        });

        // Highlight blocked points
        blockedPoints.forEach(point => {
            const marker = this.pointLayers[point];
            if (marker) {
                marker.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                }));
            }
        });
    }

    calculateDistance(point1, point2) {
        const R = 6371;
        const lat1 = point1.lat * Math.PI / 180;
        const lat2 = point2.lat * Math.PI / 180;
        const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
        const deltaLon = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // ACO specific methods
    clearPheromoneLines() {
        this.pheromoneLines.forEach(line => line.remove());
        this.pheromoneLines = [];
    }

    drawPheromone(point1, point2, intensity, value) {
        const line = L.polyline(
            [[point1.lat, point1.lng], [point2.lat, point2.lng]],
            {
                color: 'rgba(255,0,0,0.5)',
                weight: 1,
                opacity: this.pheromoneVisible ? intensity * 0.7 : 0,
                className: 'pheromone-line'
            }
        ).addTo(this.map);
        
        if (value && intensity > 0.3) {
            const midPoint = {
                lat: (point1.lat + point2.lat) / 2,
                lng: (point1.lng + point2.lng) / 2
            };
            
            L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'pheromone-value'
            })
            .setContent(value)
            .setLatLng([midPoint.lat, midPoint.lng])
            .addTo(this.map);
        }
        
        this.pheromoneLines.push(line);
    }

    updatePheromoneInfo(current, total) {
        const info = document.getElementById('iteration-info');
        if (info) {
            info.innerHTML = `Lần lặp: ${current}/${total}`;
        }
    }

    drawAntPath(points) {
        this.antPaths.forEach(path => path.remove());
        this.antPaths = [];

        points.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: L.divIcon({
                    className: 'ant-marker',
                    html: '🐜',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                rotationAngle: point.direction
            }).addTo(this.map);
            this.antPaths.push(marker);
        });

        const antLine = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FF4081',
                weight: 2,
                opacity: 0.6
            }
        ).addTo(this.map);
        
        this.antPaths.push(antLine);
    }

    drawTopPaths(paths) {
        this.topPathsLayers.forEach(layer => {
            if (Array.isArray(layer)) {
                layer.forEach(l => l.remove());
            } else {
                layer.remove();
            }
        });
        this.topPathsLayers = [];
        
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        
        paths.forEach((path, index) => {
            const color = colors[index] || colors[0];
            const points = path.path.map(p => POINTS[p]);
            
            const line = L.polyline(
                points.map(p => [p.lat, p.lng]),
                {
                    color: color,
                    weight: 4 - index * 0.5,
                    opacity: 0.8 - index * 0.1
                }
            ).addTo(this.map);

            const label = L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'path-label'
            })
            .setContent(`#${index + 1}: ${path.distance.toFixed(1)}km`)
            .setLatLng([
                points[Math.floor(points.length/2)].lat,
                points[Math.floor(points.length/2)].lng
            ]);
            
            label.addTo(this.map);
            
            this.topPathsLayers.push([line, label]);
        });

        const pathResult = document.getElementById('pathResult');
        if (pathResult) {
            pathResult.innerHTML = `
                <div class="top-paths">
                    <h4>Top ${paths.length} đường đi tốt nhất:</h4>
                    ${paths.map((path, index) => `
                        <div class="path-item" style="border-left: 4px solid ${colors[index]}">
                            <div class="path-rank">#${index + 1}</div>
                            <div class="path-detail">
                                <div class="path-points">${path.path.join(' → ')}</div>
                                <div class="path-distance">${path.distance.toFixed(1)} km</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    updateAcoProgress(message) {
        const progressElement = document.getElementById('aco-progress');
        if (progressElement) {
            progressElement.textContent = message;
        }
    }

    updateIterationInfo(current, total) {
        document.getElementById('iteration-count').innerHTML = 
            `Iteration: ${current}/${total}`;
    }

    updateBestPathInfo(iteration, path, distance) {
        const info = document.getElementById('best-path-info');
        if (info) {
            info.innerHTML = `
                <div class="iteration-header">Lần lặp ${iteration}</div>
                <div class="best-path-item">
                    <div class="path-points">${path.join(' → ')}</div>
                    <div class="path-distance">${distance.toFixed(1)} km</div>
                </div>
            `;
        }

        // Xóa đường đi tốt nhất cũ trên bản đồ
        if (this.bestPathLayer) {
            if (Array.isArray(this.bestPathLayer)) {
                this.bestPathLayer.forEach(layer => {
                    if (layer && typeof layer.remove === 'function') {
                        layer.remove();
                    }
                });
            } else if (typeof this.bestPathLayer.remove === 'function') {
                this.bestPathLayer.remove();
            }
            this.bestPathLayer = null;
        }

        // Vẽ đường đi tốt nhất mới
        const points = path.map(point => POINTS[point]).filter(p => p);
        this.bestPathLayer = [];

        // Vẽ đường đi
        const pathLine = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FFD700',
                weight: 4,
                opacity: 0.8
            }
        ).addTo(this.map);
        this.bestPathLayer.push(pathLine);

        // Vẽ markers cho các điểm
        points.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }).addTo(this.map);
            this.bestPathLayer.push(marker);
        });
    }

    updateAntPathsInfo(iteration, paths, distances) {
        const list = document.getElementById('ant-paths-list');
        if (list) {
            // Giới hạn hiển thị 5 đường đi tốt nhất
            const bestPaths = paths.map((path, index) => ({
                path,
                distance: distances[index]
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

            list.innerHTML = `
                <div class="iteration-header">Lần lặp ${iteration}</div>
                ${bestPaths.map((p, i) => `
                    <div class="ant-path-item">
                        <span class="path-rank">#${i + 1}</span>
                        <span class="path-points">${p.path.join(' → ')}</span>
                        <span class="path-distance">${p.distance.toFixed(1)} km</span>
                    </div>
                `).join('')}
            `;
        }
    }

    // Thêm panel thông tin ACO
    addAcoInfoPanel() {
        // Panel thông tin về tiến trình ACO
        this.acoInfo = L.control({ position: 'bottomleft' });
        this.acoInfo.onAdd = () => {
            const div = L.DomUtil.create('div', 'info-panel aco-info');
            div.innerHTML = `
                <div class="info-header">
                    <h4>ACO Progress</h4>
                </div>
                <div id="iteration-count">Iteration: 0/0</div>
                <div id="best-distance">Best Distance: 0 km</div>
                <div id="ant-paths-list"></div>
            `;
            return div;
        };
        this.acoInfo.addTo(this.map);

        // Panel thông tin về đường đi tốt nhất
        this.bestPathInfo = L.control({ position: 'bottomleft' });
        this.bestPathInfo.onAdd = () => {
            const div = L.DomUtil.create('div', 'info-panel best-path-info');
            div.innerHTML = `
                <h4>Đường đi tốt nhất</h4>
                <div id="best-path-info"></div>
            `;
            return div;
        };
        this.bestPathInfo.addTo(this.map);
    }

    highlightBestPath(points, distance, isTemporary = false) {
        // Xóa các layer cũ
        if (this.bestPathLayer) {
            if (Array.isArray(this.bestPathLayer)) {
                this.bestPathLayer.forEach(layer => layer.remove());
            } else {
                this.bestPathLayer.remove();
            }
        }
        this.bestPathLayer = [];  // Khởi tạo lại mảng rỗng

        // Tạo marker cho mỗi điểm
        points.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                }),
                rotationAngle: point.direction
            }).addTo(this.map);
            this.bestPathLayer.push(marker);
        });

        // Vẽ đường đi
        const pathLine = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FFD700',
                weight: 4,
                opacity: 0.8
            }
        ).addTo(this.map);
        
        this.bestPathLayer.push(pathLine);

        // Cập nhật thông tin khoảng cách
        if (!isTemporary) {
            const bestDistance = document.getElementById('best-distance');
            if (bestDistance) {
                bestDistance.innerHTML = `Khoảng cách: ${distance.toFixed(1)} km`;
            }
        }

        // Fit bản đồ để hiển thị toàn bộ đường đi
        this.map.fitBounds(pathLine.getBounds(), {
            padding: [50, 50]
        });
    }
}