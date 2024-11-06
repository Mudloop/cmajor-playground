type TaskFunction = () => Promise<any>;

export class TaskManager {
	static ownedManagers: Map<any, TaskManager> = new Map();

	static get(owner: any): TaskManager {
		let manager = this.ownedManagers.get(owner);
		if (manager == null) {
			manager = new TaskManager(1);
			this.ownedManagers.set(owner, manager);
		}
		return manager;
	}

	static addTask(owner: any, taskFunction: TaskFunction): Promise<any> {
		return TaskManager.get(owner).addTask(taskFunction);
	}

	static await(owner: any): Promise<void> {
		return TaskManager.get(owner).wait();
	}

	max: number;
	tasks: number;
	queue: TaskFunction[];
	all: Promise<any>[];

	constructor(max: number) {
		this.max = max;
		this.tasks = 0;
		this.queue = [];
		this.all = [];
	}

	addTask(taskFunction: TaskFunction): Promise<any> {
		let resolve: (value?: any) => void;
		let reject: (reason?: any) => void;

		const promise = new Promise<any>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this.all.push(promise);

		const task = async () => {
			try {
				const ret = await taskFunction();
				resolve(ret);
			} catch (error) {
				reject(error);
			} finally {
				this.tasks--;
				this.processNextTask();
				const index = this.all.indexOf(promise);
				if (index > -1) {
					this.all.splice(index, 1);
				}
			}
		};

		if (this.tasks < this.max) {
			this.tasks++;
			task();
		} else {
			this.queue.push(task);
		}

		return promise;
	}

	processNextTask() {
		if (this.queue.length > 0 && this.tasks < this.max) {
			const nextTask = this.queue.shift()!;
			this.tasks++;
			nextTask();
		}
	}

	async wait(): Promise<void> {
		const currentTasks = [...this.all];
		await Promise.all(currentTasks);
	}
}