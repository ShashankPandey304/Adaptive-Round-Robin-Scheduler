#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define MAX_PROCESSES 15

typedef struct {
    int id;
    int at; // arrival time
    int bt; // burst time
    int rt; // remaining time
    int ct; // completion time
    int tat; // turnaround time
    int wt; // waiting time
} Process;

void sort_by_arrival(Process p[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (p[j].at > p[j + 1].at) {
                Process temp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = temp;
            }
        }
    }
}

void sort_by_id(Process p[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (p[j].id > p[j + 1].id) {
                Process temp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = temp;
            }
        }
    }
}

void simulate_adaptive_rr(Process original_list[], int n) {
    Process p_list[MAX_PROCESSES];
    for(int i=0; i<n; i++) {
        p_list[i] = original_list[i];
    }
    sort_by_arrival(p_list, n);

    int t = 0;
    Process* rq[100];
    int head = 0, tail = 0;
    
    int pIdx = 0;
    int cycleNum = 1;

    while(pIdx < n && p_list[pIdx].at <= t) {
        rq[tail++] = &p_list[pIdx++];
    }

    printf("\n--- Execution Log ---\n");

    while ((tail - head) > 0 || pIdx < n) {
        if ((tail - head) == 0) {
            int nextArrival = p_list[pIdx].at;
            printf("Time %d to %d: Idle\n", t, nextArrival);
            t = nextArrival;
            while(pIdx < n && p_list[pIdx].at <= t) {
                rq[tail++] = &p_list[pIdx++];
            }
        }

        int N = tail - head;
        if(N == 0) continue;

        int sumRT = 0;
        for (int i = head; i < tail; i++) {
            sumRT += rq[i]->rt;
        }
        int currentTQ = (int)ceil((double)sumRT / N);
        if (currentTQ < 1) currentTQ = 1;
        
        printf("\nCycle %d: TQ = %d (Sum of RT: %d / Processes in Queue: %d)\n", cycleNum, currentTQ, sumRT, N);

        Process* nextRq[100];
        int nextTail = 0;

        for (int i = 0; i < N; i++) {
            Process* p = rq[head++];
            int timeToRun = p->rt < currentTQ ? p->rt : currentTQ;
            int startT = t;
            t += timeToRun;
            p->rt -= timeToRun;

            printf("  P%d runs from %d to %d (Remaining: %d)\n", p->id, startT, t, p->rt);

            while(pIdx < n && p_list[pIdx].at <= t) {
                nextRq[nextTail++] = &p_list[pIdx++];
            }

            if (p->rt > 0) {
                nextRq[nextTail++] = p;
            } else {
                p->ct = t;
                p->tat = p->ct - p->at;
                p->wt = p->tat - p->bt;
            }
        }
        
        head = 0;
        tail = nextTail;
        for (int i = 0; i < nextTail; i++) {
            rq[i] = nextRq[i];
        }

        cycleNum++;
    }

    sort_by_id(p_list, n);
    
    printf("\n--- Final Results ---\n");
    printf("PID\tAT\tBT\tCT\tTAT\tWT\n");
    double sumTat = 0, sumWt = 0;

    for (int i = 0; i < n; i++) {
        printf("P%d\t%d\t%d\t%d\t%d\t%d\n", p_list[i].id, p_list[i].at, p_list[i].bt, p_list[i].ct, p_list[i].tat, p_list[i].wt);
        sumTat += p_list[i].tat;
        sumWt += p_list[i].wt;
    }
    printf("\nAverage Turnaround Time: %.2f\n", sumTat / n);
    printf("Average Waiting Time: %.2f\n", sumWt / n);
}

int main() {
    int n;
    printf("==========================================\n");
    printf("  Adaptive Round Robin Scheduler Simulator\n");
    printf("==========================================\n");
    printf("Enter number of processes (1-%d): ", MAX_PROCESSES);
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX_PROCESSES) {
        printf("Invalid input.\n");
        return 1;
    }

    Process p_list[MAX_PROCESSES];
    for (int i = 0; i < n; i++) {
        p_list[i].id = i + 1;
        printf("Enter Arrival Time and Burst Time for P%d: ", i + 1);
        if (scanf("%d %d", &p_list[i].at, &p_list[i].bt) != 2) {
             printf("Invalid input.\n");
             return 1;
        }
        p_list[i].rt = p_list[i].bt;
        p_list[i].ct = 0;
        p_list[i].tat = 0;
        p_list[i].wt = 0;
    }

    simulate_adaptive_rr(p_list, n);

    return 0;
}
