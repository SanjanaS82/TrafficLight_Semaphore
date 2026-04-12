#include "../include/common.h"

int current_signal = 0;
int ns_turn = 0; 
int ew_turn = 0; 

int get_current_signal() {
    return current_signal;
}

void switch_signal() {
    current_signal = !current_signal;
    // ns_turn = 0;
    // ew_turn = 0;
}

void traffic_controller() {
    while (1) {
        print_signal_status();
        sleep(5);
        switch_signal();
    }
}