class AntColonyOptimizer {
    constructor() {
        this.pheromoneMatrix = {};
        this.params = {
            antCount: 20,
            evaporationRate: 0.1,
            alpha: 1,
            beta: 2,
            iterations: 50,
            initialPheromone: 1.0
        };
        this.currentIteration = 0;
        this.bestPath = null;
        this.bestDistance = Infinity;
        this.mapHandler = null;
        this.isRunning = false;
    }

    setMapHandler(mapHandler) {
        this.mapHandler = mapHandler;
    }

    initializePheromones() {
        Object.keys(POINTS).forEach(point1 => {
            this.pheromoneMatrix[point1] = {};
            Object.keys(POINTS).forEach(point2 => {
                if(point1 !== point2) {
                    this.pheromoneMatrix[point1][point2] = this.params.initialPheromone;
                }
            });
        });
    }

    async findPath(start, end, via = null) {
        this.isRunning = true;
        this.initializePheromones();
        this.currentIteration = 0;
        this.bestPath = null;
        this.bestDistance = Infinity;

        this.visualizePheromones();

        for(let iter = 0; iter < this.params.iterations; iter++) {
            if (!this.isRunning) {
                console.log("ACO stopped by user");
                break;
            }

            this.currentIteration = iter;
            this.mapHandler.updateIterationInfo(iter + 1, this.params.iterations);
            
            const paths = await this.releaseAnts(start, end, via);
            this.updatePheromones(paths);
            this.visualizePheromones();

            const bestIterPath = paths.reduce((best, current) => 
                current.distance < best.distance ? current : best
            );

            if(bestIterPath.distance < this.bestDistance) {
                this.bestDistance = bestIterPath.distance;
                this.bestPath = bestIterPath.path;
                this.visualizeBestPath();
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.isRunning = false;
        return this.bestPath;
    }

    async releaseAnts(start, end, via) {
        const paths = [];
        
        for(let ant = 0; ant < this.params.antCount; ant++) {
            const path = await this.constructPath(start, end, via);
            paths.push(path);
            
            this.visualizeAntPath(path.path);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return paths;
    }

    visualizePheromones() {
        if(!this.mapHandler) return;
        
        this.mapHandler.clearPheromoneLines();
        
        Object.keys(this.pheromoneMatrix).forEach(from => {
            Object.keys(this.pheromoneMatrix[from]).forEach(to => {
                const pheromoneLevel = this.pheromoneMatrix[from][to];
                const maxPheromone = this.params.initialPheromone * 2;
                const opacity = Math.min(pheromoneLevel / maxPheromone, 1);
                
                this.mapHandler.drawPheromone(
                    POINTS[from],
                    POINTS[to],
                    opacity
                );
            });
        });
    }

    visualizeAntPath(path) {
        if(!this.mapHandler) return;
        this.mapHandler.drawAntPath(path.map(point => POINTS[point]));
    }

    visualizeBestPath() {
        if(!this.mapHandler || !this.bestPath) return;
        this.mapHandler.highlightBestPath(
            this.bestPath.map(point => POINTS[point]),
            this.bestDistance
        );
    }

    async constructPath(start, end, via = null) {
        if (via) {
            const path1 = await this.buildPathSegment(start, via);
            const path2 = await this.buildPathSegment(via, end);
            
            path2.shift();
            
            return {
                path: [...path1, ...path2],
                distance: this.calculatePathDistance([...path1, ...path2])
            };
        } else {
            const path = await this.buildPathSegment(start, end);
            return {
                path: path,
                distance: this.calculatePathDistance(path)
            };
        }
    }

    async buildPathSegment(start, end) {
        let current = start;
        const path = [start];
        const visited = new Set([start]);
        
        while (current !== end) {
            const next = this.selectNextPoint(current, end, visited);
            if (!next) break;
            
            path.push(next);
            visited.add(next);
            current = next;
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return path;
    }

    selectNextPoint(current, end, visited) {
        const available = Object.keys(POINTS).filter(point => 
            !visited.has(point) && this.isValidMove(current, point)
        );

        if (available.length === 0) return null;

        const total = available.reduce((sum, point) => {
            return sum + this.calculateProbability(current, point, end);
        }, 0);

        const random = Math.random() * total;
        let cumulative = 0;

        for (const point of available) {
            cumulative += this.calculateProbability(current, point, end);
            if (cumulative >= random) {
                return point;
            }
        }

        return available[available.length - 1];
    }

    isValidMove(from, to) {
        return true;
    }

    calculateProbability(from, to, end) {
        const pheromone = Math.pow(this.pheromoneMatrix[from][to], this.params.alpha);
        const distance = Math.pow(1/this.calculateDistance(POINTS[from], POINTS[to]), this.params.beta);
        return pheromone * distance;
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

    calculatePathDistance(path) {
        let distance = 0;
        for(let i = 0; i < path.length - 1; i++) {
            distance += this.calculateDistance(POINTS[path[i]], POINTS[path[i+1]]);
        }
        return distance;
    }

    updatePheromones(paths) {
        paths.forEach(path => {
            const distance = path.distance;
            const pheromoneDelta = this.params.initialPheromone / distance;
            for(let i = 0; i < path.path.length - 1; i++) {
                this.pheromoneMatrix[path.path[i]][path.path[i+1]] += pheromoneDelta;
            }
        });
    }

    stop() {
        this.isRunning = false;
    }
}