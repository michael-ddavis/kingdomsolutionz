import {
  Component
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable
} from 'rxjs';

import {
  Assignment,
  AssignmentStage,
  AssignmentStageStatus,
  AssignmentTask,
  AssignmentTaskStatus
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

@Component({
  standalone: false,
  selector:
    'app-assignment-detail',

  templateUrl:
    './assignment-detail.component.html',

  styleUrls: [
    './assignment-detail.component.scss'
  ]
})
export class AssignmentDetailComponent {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  expandedCommentTaskId:
    number | null = null;

  readonly stageExpansionOverrides:
    Record<string, boolean> = {};

  readonly commentDrafts:
    Record<number, string> = {};

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  readonly stageLabels:
    Record<
      AssignmentStageStatus,
      string
    > = {
      complete:
        'Complete',

      current:
        'In progress',

      upcoming:
        'Upcoming',

      blocked:
        'Needs attention'
    };

  readonly taskLabels:
    Record<
      AssignmentTaskStatus,
      string
    > = {
      'not-started':
        'Not started',

      'in-progress':
        'In progress',

      complete:
        'Complete',

      blocked:
        'Blocked'
    };

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly assignmentService:
      AssignmentService
  ) {}

  toggleTask(
    assignmentId: number,
    stageId: string,
    task: AssignmentTask
  ): void {
    this.assignmentService.toggleTask(
      assignmentId,
      stageId,
      task
    );
  }

  isStageExpanded(
    stage: AssignmentStage
  ): boolean {
    return this.stageExpansionOverrides[stage.id] ??
      (
        stage.status === 'current' ||
        stage.status === 'blocked'
      );
  }

  toggleStageExpansion(
    stage: AssignmentStage
  ): void {
    this.stageExpansionOverrides[stage.id] =
      !this.isStageExpanded(stage);
  }

  toggleComments(
    taskId: number
  ): void {
    this.expandedCommentTaskId =
      this.expandedCommentTaskId ===
      taskId
        ? null
        : taskId;
  }

  updateCommentDraft(
    taskId: number,
    event: Event
  ): void {
    const textarea =
      event.target as
        HTMLTextAreaElement;

    this.commentDrafts[taskId] =
      textarea.value;
  }

  getCommentDraft(
    taskId: number
  ): string {
    return (
      this.commentDrafts[
        taskId
      ] ?? ''
    );
  }

  canAddComment(
    taskId: number
  ): boolean {
    return Boolean(
      this.getCommentDraft(
        taskId
      ).trim()
    );
  }

  addComment(
    assignmentId: number,
    stageId: string,
    taskId: number
  ): void {
    const message =
      this.getCommentDraft(
        taskId
      ).trim();

    if (!message) {
      return;
    }

    this.assignmentService
      .addTaskComment(
        assignmentId,
        stageId,
        taskId,
        message
      );

    this.commentDrafts[
      taskId
    ] = '';
  }

  getCompletedTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (
        total,
        stage
      ) =>
        total +
        stage.tasks.filter(
          task =>
            task.status ===
            'complete'
        ).length,

      0
    );
  }

  getTotalTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (
        total,
        stage
      ) =>
        total +
        stage.tasks.length,

      0
    );
  }

  getCompletedStageTaskCount(
    stage: AssignmentStage
  ): number {
    return stage.tasks.filter(
      task =>
        task.status ===
        'complete'
    ).length;
  }
}
