class MapHandler {
    constructor() {
        this.map = L.map('map').setView([11.0, 110.0], 7);
        this.routeLayers = {};
        this.pointLayers = {};
        this.distanceLabels = [];
        this.pathLayer = null;
        this.dashedRoutesVisible = true;
        this.dashedRoutes = {};
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.initializePoints();
        this.initializeRoutes();
        this.addRouteToggleControl();
        document.getElementById('toggleDashedRoutes').addEventListener('click', () => {
            this.toggleDashedRoutes();
        });
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

    highlightPath(path, start, end, via) {
        this.clearHighlights();
        
        const pathPoints = [];
        let totalDistance = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
            const point1 = POINTS[path[i]];
            const point2 = POINTS[path[i + 1]];
            pathPoints.push([point1.lat, point1.lng]);
            
            const distance = this.calculateDistance(point1, point2);
            totalDistance += distance;
            
            // Tính góc của đoạn đường
            const angle = Math.atan2(point2.lng - point1.lng, point2.lat - point1.lat) * 180 / Math.PI;
            
            // Tính điểm chính giữa đoạn đường
            const midPoint = {
                lat: (point1.lat + point2.lat) / 2,
                lng: (point1.lng + point2.lng) / 2
            };
            
            // Tạo label với góc xoay phù hợp
            const distanceLabel = L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'distance-label',
                offset: [0, 0]
            })
            .setContent(`${distance.toFixed(1)} km`)
            .setLatLng([midPoint.lat, midPoint.lng]);
            
            // Điều chỉnh góc xoay của label
            const labelElement = distanceLabel.getElement();
            if (labelElement) {
                // Điều chỉnh góc để text luôn dễ đọc
                let rotationAngle = angle;
                if (angle > 90 || angle < -90) {
                    rotationAngle = angle + 180;
                }
                labelElement.style.setProperty('--angle', `${rotationAngle}deg`);
            }
            
            distanceLabel.addTo(this.map);
            this.distanceLabels.push(distanceLabel);
        }
        
        pathPoints.push([POINTS[path[path.length - 1]].lat, POINTS[path[path.length - 1]].lng]);
        
        // Vẽ đường màu vàng
        this.pathLayer = L.polyline(pathPoints, {
            color: '#FFD700',
            weight: 4,
            opacity: 0.8,
            zIndex: 1
        }).addTo(this.map);

        const pathResult = document.getElementById('pathResult');
        let resultHTML = `
            <div class="path">Đường đi: ${path.join(' → ')}</div>
            <div class="distance">Tổng khoảng cách: ${totalDistance.toFixed(1)} km</div>
        `;
        pathResult.innerHTML = resultHTML;
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
        const R = 6371; // Bán kính Trái Đất (km)
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

    toggleDashedRoutes() {
        this.dashedRoutesVisible = !this.dashedRoutesVisible;
        Object.entries(this.routeLayers).forEach(([routeName, layer]) => {
            const route = ROUTES[routeName];
            if (route && route.dashArray) {
                layer.setStyle({ opacity: this.dashedRoutesVisible ? 0.8 : 0 });
            }
        });
    }
}