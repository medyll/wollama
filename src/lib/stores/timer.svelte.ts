interface Meta {
    initialDelay: number;
    currentDelay: number;
    retryCount: number;
    maxRetries: number;
    url: string;
}

class ConnectionTimer {
    private static instance: ConnectionTimer;
    private url!: string;
    private initialDelay: number = 10000; // 10 secondes
    private currentDelay: number = this.initialDelay;
    private retryCount: number = $state(0);
    private maxRetries: number = 8;

    connected: boolean = $state(false);

    private onInitialSuccess!: (data: Meta) => void;
    private onReconnectSuccess!: (data: Meta) => void;
    private onConnectionFail!: (data: Meta) => void;

    private timer!: NodeJS.Timeout;
    private timerLoop!: NodeJS.Timeout;

    private state = $state<Meta>({
        initialDelay: this.initialDelay,
        currentDelay: this.currentDelay,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
        url: this.url,
    });

    private constructor() {}

    public static getInstance(): ConnectionTimer {
        if (!ConnectionTimer.instance) {
            ConnectionTimer.instance = new ConnectionTimer();
        }
        return ConnectionTimer.instance;
    }

    public initialize(
        url: string,
        onInitialSuccess: (data: Meta) => void,
        onReconnectSuccess: (data: Meta) => void,
        onConnectionFail: (data: Meta) => void,
        maxRetries?: number
    ): void {
        this.url = url;
        this.onInitialSuccess = onInitialSuccess;
        this.onReconnectSuccess = onReconnectSuccess;
        this.onConnectionFail = onConnectionFail;
        if (maxRetries !== undefined) {
            this.maxRetries = maxRetries;
        }
        this.connect();
        this.doLoop();
    }

    private doLoop() {
        clearTimeout(this.timerLoop);
        this.timerLoop = setInterval(() => {
            if (!this.connected) this.connect();
        }, 30000);
    }
    private async connect(): Promise<void> {
        try {
            const response = await fetch(this.url);
            clearTimeout(this.timer);
            if (response.ok) {
                if (this.retryCount === 0) {
                    this.connected = true;
                    this.onInitialSuccess(this.setState);
                } else {
                    this.connected = true;
                    this.onReconnectSuccess(this.setState);
                }
                this.resetTimer();
                this.state = this.setState;
            } else {
                this.handleConnectionFailure();
            }
        } catch (error) {
            this.handleConnectionFailure();
        }
    }

    private handleConnectionFailure(): void {
        this.connected = false;
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.currentDelay *= 2;
            this.state = this.setState;
            this.timer = setTimeout(() => this.connect(), this.currentDelay);
        } else {
            console.error('Max retries reached. Connection failed.');
            this.onConnectionFail(this.setState);
        }
    }

    get getState() {
        return this.state;
    }
    get setState() {
        return {
            initialDelay: this.initialDelay,
            currentDelay: this.currentDelay,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            connected: this.connected,
            url: this.url,
        };
    }
    private resetTimer(): void {
        this.retryCount = 0;
        this.currentDelay = this.initialDelay;
    }
}

export const connectionTimer = ConnectionTimer.getInstance();
