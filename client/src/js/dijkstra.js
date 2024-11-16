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
    }

    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) {
            this.adjacencyList[vertex] = [];
        }
    }

    addEdge(vertex1, vertex2, weight) {
        this.adjacencyList[vertex1].push({ node: vertex2, weight });
        this.adjacencyList[vertex2].push({ node: vertex1, weight });
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

    clone() {
        const newGraph = new Graph();
        for (let vertex in this.adjacencyList) {
            newGraph.adjacencyList[vertex] = [...this.adjacencyList[vertex]];
        }
        return newGraph;
    }

    removeVertex(vertex) {
        for (let adjVertex in this.adjacencyList) {
            this.adjacencyList[adjVertex] = this.adjacencyList[adjVertex].filter(
                edge => edge.node !== vertex
            );
        }
        delete this.adjacencyList[vertex];
    }

    dijkstra(start, finish, excludePoint = null) {
        if (excludePoint) {
            const tempGraph = this.clone();
            tempGraph.removeVertex(excludePoint);
            return tempGraph.dijkstra(start, finish);
        }

        const nodes = new PriorityQueue();
        const distances = {};
        const previous = {};
        let path = [];
        let smallest;

        // Build initial state
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

        // Tìm đường đi ngắn nhất
        while (nodes.values.length) {
            smallest = nodes.dequeue().val;
            if (smallest === finish) {
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

        if (!path.length && start !== finish) {
            return null;
        }

        path.push(start);
        return path.reverse();
    }
}
