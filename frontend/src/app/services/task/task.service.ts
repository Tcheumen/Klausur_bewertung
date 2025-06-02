import { Injectable } from '@angular/core';
import { Task } from '../../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor() { }

  tasks: Task[] = [];
  addTask(name: string, weight: number): void {
    if (!this.tasks.find(t => t.name === name)) {
      this.tasks.push({ name, weight });
    }
  }
  removeTask(name: string): void {
    this.tasks = this.tasks.filter(t => t.name !== name);
  }
  getTasks(): Task[] {
    return this.tasks;
  }
}
