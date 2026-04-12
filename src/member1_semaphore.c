#include "../include/common.h"

int semaphore = 1;

void wait_semaphore(int *S) {
    while (*S <= 0);  // busy wait
    (*S)--;
}

void signal_semaphore(int *S) {
    (*S)++;
}