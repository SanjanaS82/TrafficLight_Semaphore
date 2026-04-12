#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

// Directions
#define NORTH 0
#define SOUTH 1
#define EAST  2
#define WEST  3

// Shared variables
extern int semaphore;
extern int current_signal;
// extern int ns_turn;
// extern int ew_turn;

// Function declarations
void wait_semaphore(int *S);
void signal_semaphore(int *S);

void* north_traffic(void* arg);
void* south_traffic(void* arg);
void* east_traffic(void* arg);
void* west_traffic(void* arg);

void traffic_controller();
int get_current_signal();
void switch_signal();

void display_status(char* direction);
void print_signal_status();

#endif