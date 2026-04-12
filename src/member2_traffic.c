#include "../include/common.h"

// 🚗 NORTH traffic
void* north_traffic(void* arg) {
    while (1) {

        // Wait until North-South signal is GREEN (signal == 0)
        while (current_signal != 0) {
            sleep(1);
        }

        wait_semaphore(&semaphore);

        if (current_signal == 0) {
            display_status("North");
            sleep(1);
        }

        signal_semaphore(&semaphore);
        sleep(1);
    }
}

// 🚗 SOUTH traffic
void* south_traffic(void* arg) {
    while (1) {

        // Wait until North-South signal is GREEN (signal == 0)
        while (current_signal != 0) {
            sleep(1);
        }

        wait_semaphore(&semaphore);

        if (current_signal == 0) {
            display_status("South");
            sleep(1);
        }

        signal_semaphore(&semaphore);
        sleep(1);
    }
}

// 🚗 EAST traffic
void* east_traffic(void* arg) {
    while (1) {

        // Wait until East-West signal is GREEN (signal == 1)
        while (current_signal != 1) {   // ✅ FIXED: was != 0
            sleep(1);
        }

        wait_semaphore(&semaphore);

        if (current_signal == 1) {
            display_status("East");
            sleep(1);
        }

        signal_semaphore(&semaphore);
        sleep(1);
    }
}

// 🚗 WEST traffic
void* west_traffic(void* arg) {
    while (1) {

        // Wait until East-West signal is GREEN (signal == 1)
        while (current_signal != 1) {   // ✅ FIXED: was != 0
            sleep(1);
        }

        wait_semaphore(&semaphore);

        if (current_signal == 1) {
            display_status("West");
            sleep(1);
        }

        signal_semaphore(&semaphore);
        sleep(1);
    }
}