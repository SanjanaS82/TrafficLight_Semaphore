#include "../include/common.h"
#include <time.h>

// Vehicle count trackers
int ns_count = 0;
int ew_count = 0;

void display_status(char* direction) {
    time_t now = time(NULL);
    struct tm *t = localtime(&now);

    const char* arrow = "";
    const char* color = "";

    if      (strcmp(direction, "North") == 0) { arrow = "⬆ "; color = "\033[1;36m"; }
    else if (strcmp(direction, "South") == 0) { arrow = "⬇ "; color = "\033[1;36m"; }
    else if (strcmp(direction, "East")  == 0) { arrow = "➡ "; color = "\033[1;35m"; }
    else if (strcmp(direction, "West")  == 0) { arrow = "⬅ "; color = "\033[1;35m"; }

    if (current_signal == 0) ns_count++;
    else                     ew_count++;

    printf("  %s[%02d:%02d:%02d] %s%s \033[0m vehicle passing | North-South vehicle: %d  East-West vehicle: %d\n",
           color, t->tm_hour, t->tm_min, t->tm_sec,
           arrow, direction,
           ns_count, ew_count);
}

void print_signal_status() {
    printf("\n");
    printf("  -------------------------------------\n");
    if (current_signal == 0) {
        printf("  |   North-South  \033[1;32mGREEN\033[0m              |\n");
        printf("  |   East-West    \033[1;31mRED\033[0m                |\n");
    } else {
        printf("  |   North-South  \033[1;31mRED\033[0m                |\n");
        printf("  |   East-West    \033[1;32mGREEN\033[0m              |\n");
    }
    printf("  -------------------------------------\n");
}

int main() {
    printf("\n  \033[1;33m---------------------------------------\033[0m\n");
    printf("  \033[1;33m|     TRAFFIC INTERSECTION SYSTEM      |\033[0m\n");
    printf("  \033[1;33m----------------------------------------\033[0m\n");

    pthread_t north, south, east, west, controller;

    pthread_create(&north,      NULL, north_traffic,          NULL);
    pthread_create(&south,      NULL, south_traffic,          NULL);
    pthread_create(&east,       NULL, east_traffic,           NULL);
    pthread_create(&west,       NULL, west_traffic,           NULL);
    pthread_create(&controller, NULL, (void*)traffic_controller, NULL);

    pthread_join(north,      NULL);
    pthread_join(south,      NULL);
    pthread_join(east,       NULL);
    pthread_join(west,       NULL);
    pthread_join(controller, NULL);

    return 0;
}