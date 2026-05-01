#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define MAX_PROCESSES 100
#define MAX_GANTT 2000
#define MAX_QL 500

typedef struct {
    int id;
    int at;
    int bt;
    int rt;
    int ct;
    int tat;
    int wt;
    int response;
    int first_run;
    int ql[MAX_QL];
    int q_count;
    int q_total;
} Process;

typedef struct {
    int pid;
    int start;
    int end;
    int tq;
} Gantt;

Gantt gantt[MAX_GANTT];
int gIndex = 0;
int context_switches = 0;
int last_pid = -999;
int busy_time = 0;

void sort_by_arrival(Process p[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (p[j].at > p[j+1].at) {
                Process tmp = p[j]; p[j] = p[j+1]; p[j+1] = tmp;
            }
}

void sort_by_id(Process p[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (p[j].id > p[j+1].id) {
                Process tmp = p[j]; p[j] = p[j+1]; p[j+1] = tmp;
            }
}

void simulate_adaptive_rr(Process original_list[], int n, int base_quantum) {
    Process p_list[MAX_PROCESSES];
    for (int i = 0; i < n; i++) {
        p_list[i] = original_list[i];
        p_list[i].first_run = 0;
        p_list[i].q_count = 0;
        p_list[i].q_total = 0;
    }
    sort_by_arrival(p_list, n);

    int t = 0;
    Process* rq[1000];
    int head = 0, tail = 0;
    int pIdx = 0;

    while (pIdx < n && p_list[pIdx].at <= t)
        rq[tail++] = &p_list[pIdx++];

    while ((tail - head) > 0 || pIdx < n) {
        if ((tail - head) == 0) {
            int nextArrival = p_list[pIdx].at;
            gantt[gIndex].pid   = -1;
            gantt[gIndex].start = t;
            gantt[gIndex].end   = nextArrival;
            gantt[gIndex].tq    = 0;
            gIndex++;
            t = nextArrival;
            while (pIdx < n && p_list[pIdx].at <= t)
                rq[tail++] = &p_list[pIdx++];
        }

        int N = tail - head;
        if (N == 0) continue;

        int sumRT = 0;
        for (int i = head; i < tail; i++) sumRT += rq[i]->rt;

        int currentTQ = (int)ceil((double)sumRT / N);
        if (currentTQ < base_quantum) currentTQ = base_quantum;
        if (currentTQ < 1) currentTQ = 1;

        Process* nextRq[1000];
        int nextTail = 0;

        for (int i = 0; i < N; i++) {
            Process* p = rq[head++];

            /* Response time: first time process gets CPU */
            if (!p->first_run) {
                p->response = t - p->at;
                p->first_run = 1;
            }

            /* Context switches */
            if (last_pid != -999 && last_pid != -1 && last_pid != p->id)
                context_switches++;
            last_pid = p->id;

            int timeToRun = p->rt < currentTQ ? p->rt : currentTQ;
            int startT = t;
            t += timeToRun;
            p->rt -= timeToRun;
            busy_time += timeToRun;

            /* Quantum log per process */
            if (p->q_count < MAX_QL) {
                p->ql[p->q_count++] = currentTQ;
                p->q_total += currentTQ;
            }

            /* Gantt — merge adjacent same-process blocks */
            if (gIndex > 0 && gantt[gIndex-1].pid == p->id && gantt[gIndex-1].end == startT) {
                gantt[gIndex-1].end = t;
            } else {
                gantt[gIndex].pid   = p->id;
                gantt[gIndex].start = startT;
                gantt[gIndex].end   = t;
                gantt[gIndex].tq    = currentTQ;
                gIndex++;
            }

            while (pIdx < n && p_list[pIdx].at <= t)
                nextRq[nextTail++] = &p_list[pIdx++];

            if (p->rt > 0) {
                nextRq[nextTail++] = p;
            } else {
                p->ct  = t;
                p->tat = p->ct - p->at;
                p->wt  = p->tat - p->bt;
            }
        }

        head = 0;
        tail = nextTail;
        for (int i = 0; i < nextTail; i++) rq[i] = nextRq[i];
    }

    sort_by_id(p_list, n);

    int total_time = t;
    double cpu_util   = (total_time > 0) ? (double)busy_time / total_time * 100.0 : 0.0;
    double throughput = (total_time > 0) ? (double)n / total_time : 0.0;

    int total_q = 0, total_rounds = 0;
    for (int i = 0; i < n; i++) {
        total_q     += p_list[i].q_total;
        total_rounds += p_list[i].q_count;
    }
    double avg_quantum = (total_rounds > 0) ? (double)total_q / total_rounds : 0.0;

    /* ---- JSON OUTPUT ---- */
    printf("{\n");
    printf("  \"total_time\": %d,\n", total_time);
    printf("  \"cpu_utilization\": %.1f,\n", cpu_util);
    printf("  \"throughput\": %.3f,\n", throughput);
    printf("  \"avg_quantum\": %.1f,\n", avg_quantum);
    printf("  \"context_switches\": %d,\n", context_switches);

    printf("  \"gantt\": [\n");
    for (int i = 0; i < gIndex; i++) {
        printf("    {\"pid\": %d, \"start\": %d, \"end\": %d, \"tq\": %d}%s\n",
            gantt[i].pid, gantt[i].start, gantt[i].end, gantt[i].tq,
            (i == gIndex - 1) ? "" : ",");
    }
    printf("  ],\n");

    printf("  \"results\": [\n");
    for (int i = 0; i < n; i++) {
        printf("    {\"pid\": %d, \"at\": %d, \"bt\": %d, \"ct\": %d, \"tat\": %d, \"wt\": %d, \"response\": %d, \"q_used\": %d, \"quantum_log\": [",
            p_list[i].id, p_list[i].at, p_list[i].bt,
            p_list[i].ct, p_list[i].tat, p_list[i].wt,
            p_list[i].response, p_list[i].q_count);
        for (int j = 0; j < p_list[i].q_count; j++)
            printf("%d%s", p_list[i].ql[j], (j == p_list[i].q_count - 1) ? "" : ",");
        printf("]}%s\n", (i == n - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

int main() {
    int n, base_quantum;

    if (scanf("%d %d", &n, &base_quantum) != 2 || n < 1 || n > MAX_PROCESSES) {
        fprintf(stderr, "Invalid input.\n");
        return 1;
    }
    if (base_quantum < 1) base_quantum = 1;

    Process p_list[MAX_PROCESSES];
    for (int i = 0; i < n; i++) {
        if (scanf("%d %d %d", &p_list[i].id, &p_list[i].at, &p_list[i].bt) != 3) {
            fprintf(stderr, "Invalid process data.\n");
            return 1;
        }
        p_list[i].rt       = p_list[i].bt;
        p_list[i].ct       = 0;
        p_list[i].tat      = 0;
        p_list[i].wt       = 0;
        p_list[i].response = 0;
        p_list[i].first_run = 0;
        p_list[i].q_count  = 0;
        p_list[i].q_total  = 0;
    }

    simulate_adaptive_rr(p_list, n, base_quantum);
    return 0;
}
