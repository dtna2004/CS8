class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }
}

class Graph {
    constructor() {
        this.adjacencyList = {};
        this.blockedPoints = new Set();
    }

    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) {
            this.adjacencyList[vertex] = [];
        }
    }

    addEdge(vertex1, vertex2, weight) {
        if (!this.blockedPoints.has(vertex1) && !this.blockedPoints.has(vertex2)) {
            this.adjacencyList[vertex1].push({ node: vertex2, weight });
            this.adjacencyList[vertex2].push({ node: vertex1, weight });
        }
    }

    blockPoint(point) {
        this.blockedPoints.add(point);
        if (this.adjacencyList[point]) {
            this.adjacencyList[point] = [];
        }
        for (let vertex in this.adjacencyList) {
            this.adjacencyList[vertex] = this.adjacencyList[vertex].filter(
                edge => edge.node !== point
            );
        }
    }

    dijkstra(start, end) {
        if (this.blockedPoints.has(start) || this.blockedPoints.has(end)) {
            return null;
        }

        const nodes = new PriorityQueue();
        const distances = {};
        const previous = {};
        let path = [];
        let smallest;

        for (let vertex in this.adjacencyList) {
            if (vertex === start) {
                distances[vertex] = 0;
                nodes.enqueue(vertex, 0);
            } else {
                distances[vertex] = Infinity;
                nodes.enqueue(vertex, Infinity);
            }
            previous[vertex] = null;
        }

        while (nodes.values.length) {
            smallest = nodes.dequeue().val;
            if (smallest === end) {
                while (previous[smallest]) {
                    path.push(smallest);
                    smallest = previous[smallest];
                }
                break;
            }

            if (smallest || distances[smallest] !== Infinity) {
                for (let neighbor of this.adjacencyList[smallest]) {
                    let candidate = distances[smallest] + neighbor.weight;
                    let nextNeighbor = neighbor.node;
                    if (candidate < distances[nextNeighbor]) {
                        distances[nextNeighbor] = candidate;
                        previous[nextNeighbor] = smallest;
                        nodes.enqueue(nextNeighbor, candidate);
                    }
                }
            }
        }
        return path.concat(smallest).reverse();
    }

    findPathThroughMandatoryPoints(start, end, mandatoryPoints = []) {
        const waypoints = [start, ...mandatoryPoints, end];
        let fullPath = [];
        let totalDistance = 0;

        // Tìm đường đi qua từng cặp điểm liên tiếp
        for (let i = 0; i < waypoints.length - 1; i++) {
            const pathSegment = this.dijkstra(waypoints[i], waypoints[i + 1]);
            
            if (!pathSegment) {
                console.error(`Không tìm thấy đường đi từ ${waypoints[i]} đến ${waypoints[i + 1]}`);
                return null;
            }

            // Loại bỏ điểm trùng lặp giữa các đoạn
            if (i > 0) {
                pathSegment.shift();
            }
            
            fullPath = [...fullPath, ...pathSegment];
        }

        return {
            path: fullPath,
            distance: this.calculatePathDistance(fullPath)
        };
    }

    calculatePathDistance(path) {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const point1 = POINTS[path[i]];
            const point2 = POINTS[path[i + 1]];
            distance += this.calculateDistance(point1, point2);
        }
        return distance;
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
}
