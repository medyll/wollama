declare module 'fluent-ffmpeg' {
	interface FfmpegCommand {
		toFormat(format: string): FfmpegCommand;
		audioFrequency(frequency: number): FfmpegCommand;
		audioChannels(channels: number): FfmpegCommand;
		on(event: 'end', listener: () => void): FfmpegCommand;
		on(event: 'error', listener: (error: Error) => void): FfmpegCommand;
		save(path: string): FfmpegCommand;
	}

	interface Ffmpeg {
		(input: string): FfmpegCommand;
		setFfmpegPath(path: string): void;
	}

	const ffmpeg: Ffmpeg;
	export default ffmpeg;
}
