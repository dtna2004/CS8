class MapHandler {
    constructor() {
        this.map = L.map('map').setView([11.0, 110.0], 7);
        this.routeLayers = {};
        this.pointLayers = {};
        this.distanceLabels = [];
        this.pathLayer = null;
        this.dashedRoutesVisible = true;
        this.dashedRoutes = {};
        this.pheromoneLines = [];
        this.antPaths = [];
        this.iterationInfo = L.control({ position: 'bottomleft' });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.initializePoints();
        this.initializeRoutes();
        this.addRouteToggleControl();
        this.addIterationControl();
        //document.getElementById('toggleDashedRoutes').addEventListener('click', () => {
        //   this.toggleDashedRoutes();
        //});
    }

    addRouteToggleControl() {
        const routeControl = L.control({ position: 'topright' });
        routeControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'route-toggle');
            div.innerHTML = `
                <div class="toggle-control">
                    <label>
                        <input type="checkbox" id="toggleRoutes" checked>
                        Hiển thị đường bay
                    </label>
                </div>
            `;
            return div;
        };
        routeControl.addTo(this.map);

        document.getElementById('toggleRoutes').addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            Object.entries(this.routeLayers).forEach(([routeName, layer]) => {
                if (routeName !== 'boundary' && layer._map) {
                    layer.setStyle({ opacity: isVisible ? 0.8 : 0 });
                }
            });
        });
    }

    initializePoints() {
        //Tô màu cho điểm ở đây, ẩn điểm ở đây
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
                    offset: [-15, 20]
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

    hidePoint(pointName) {
        const marker = this.pointLayers[pointName];
        if (marker) {
            marker.setOpacity(0.3);
        }
    }

    showPoint(pointName) {
        const marker = this.pointLayers[pointName];
        if (marker) {
            marker.setOpacity(1);
        }
    }

    clearHighlights() {
        // Chỉ xóa đường đi được highlight trước đó
        if (this.pathLayer) {
            this.pathLayer.remove();
        }
        
        // Xóa các label khoảng cách
        this.distanceLabels.forEach(label => {
            label.remove();
        });
        this.distanceLabels = [];
        
        // Khôi phục opacity của tất cả các điểm
        Object.values(this.pointLayers).forEach(marker => {
            marker.setOpacity(1);
        });
        
        // Khôi phục opacity của tất cả các đường bay
        Object.values(this.routeLayers).forEach(layer => {
            if (layer._map) {
                layer.setStyle({ opacity: 0.8, weight: 2 });
            }
        });
    }

    highlightPath(path, totalDistance) {
        this.clearHighlights();
        
        const points = path.map(point => POINTS[point]);
        
        // Vẽ đường đi màu vàng
        this.pathLayer = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FFD700',
                weight: 4,
                opacity: 0.8
            }
        ).addTo(this.map);

        // Hiển thị khoảng cách cho từng đoạn
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

        // Hiển thị tổng khoảng cách
        const pathResult = document.getElementById('pathResult');
        pathResult.innerHTML = `
            <div class="path">Đường đi: ${path.join(' → ')}</div>
            <div class="distance">Tổng khoảng cách: ${totalDistance.toFixed(1)} km</div>
        `;
    }

    highlightSpecialPoints(start, end, via) {
        // Highlight điểm xuất phát
        const startMarker = this.pointLayers[start];
        if (startMarker) {
            startMarker.setIcon(L.divIcon({
                className: 'special-point start-point',
                html: `<div>${start}</div>`,
                iconSize: [30, 30]
            }));
        }
        
        // Highlight điểm đích
        const endMarker = this.pointLayers[end];
        if (endMarker) {
            endMarker.setIcon(L.divIcon({
                className: 'special-point end-point',
                html: `<div>${end}</div>`,
                iconSize: [30, 30]
            }));
        }
        
        // Highlight điểm chặn nếu có
        if (via) {
            const viaMarker = this.pointLayers[via];
            if (viaMarker) {
                viaMarker.setIcon(L.divIcon({
                    className: 'special-point via-point',
                    html: `<div>${via}</div>`,
                    iconSize: [30, 30]
                }));
            }
        }
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

    calculateTotalDistance(path) {
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const point1 = POINTS[path[i]];
            const point2 = POINTS[path[i + 1]];
            const distance = this.calculateDistance(point1, point2);
            totalDistance += distance;
        }
        return totalDistance;
    }

    //toggleDashedRoutes() {
    //    this.dashedRoutesVisible = !this.dashedRoutesVisible;
    //    Object.entries(this.routeLayers).forEach(([routeName, layer]) => {
    //        const route = ROUTES[routeName];
    //        if (route && route.dashArray) {
    //            layer.setStyle({ opacity: this.dashedRoutesVisible ? 0.8 : 0 });
    //        }
    //    });
    //}

    addIterationControl() {
        this.iterationInfo.onAdd = () => {
            const div = L.DomUtil.create('div', 'iteration-info');
            div.innerHTML = `
                <div class="info-panel">
                    <h4>ACO Progress</h4>
                    <div id="iteration-count">Iteration: 0/0</div>
                    <div id="best-distance">Best Distance: 0 km</div>
                </div>
            `;
            return div;
        };
        this.iterationInfo.addTo(this.map);
    }

    clearPheromoneLines() {
        this.pheromoneLines.forEach(line => line.remove());
        this.pheromoneLines = [];
    }

    drawPheromone(point1, point2, opacity) {
        const line = L.polyline(
            [[point1.lat, point1.lng], [point2.lat, point2.lng]],
            {
                color: '#2196F3',
                weight: 2,
                opacity: opacity,
                dashArray: '5,10'
            }
        ).addTo(this.map);
        
        this.pheromoneLines.push(line);
    }

    drawAntPath(points) {
        // Xóa đường đi cũ của kiến
        this.antPaths.forEach(path => path.remove());
        this.antPaths = [];

        // Vẽ đường đi mới
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

    highlightBestPath(points, distance) {
        if(this.bestPathLayer) {
            this.bestPathLayer.remove();
        }

        this.bestPathLayer = L.polyline(
            points.map(p => [p.lat, p.lng]),
            {
                color: '#FFD700',
                weight: 4,
                opacity: 0.8
            }
        ).addTo(this.map);

        // Cập nhật thông tin
        document.getElementById('best-distance').innerHTML = 
            `Best Distance: ${distance.toFixed(1)} km`;
    }

    updateIterationInfo(current, total) {
        document.getElementById('iteration-count').innerHTML = 
            `Iteration: ${current}/${total}`;
    }
}