-**Project Title**:
Traffc Light 

-**Project Overview**:
This project simulates a traffic light control system using **semaphores** in C. It demonstrates core Operating System concepts such as **process synchronization**, **mutual exclusion**, and **deadlock avoidance**.
The system manages traffic from multiple directions (North, South, East, West) and ensures that only one direction gets access (green signal) at a time, while others wait.

**Objectives**
* Implement synchronization using **semaphores**
* Simulate real-world traffic light behavior
* Prevent race conditions and deadlocks
* Understand thread coordination using **pthreads**

**Technologies Used**
C Programming Language
POSIX Threads (pthreads)
Semaphores (semaphore.h)

**Concepts Used**
* Semaphores (Binary / Counting)
* Mutual Exclusion
* Thread Synchronization
* Critical Section Problem
* Deadlock Prevention


**System Description**
* Each direction (North, South, East, West) is represented by a **thread**.
* A **semaphore** controls access to the intersection.
* Only one thread (direction) can enter the critical section (green light) at a time.
* Other threads must wait until the semaphore is released.

**Project Structure**
```
traffic-light/
│
├── main.c              # Main implementation
├── README.md           # Project documentation
```
**Working Principle**
1. Initialize semaphore with value = 1
2. Create threads for each direction
3. Each thread:
   * Waits for semaphore (sem_wait)
   * Enters critical section (green light)
   * Sleeps for a few seconds (simulating traffic flow)
   * Releases semaphore (sem_post)
4. Process repeats continuously


**How to Run**
### Step 1: Compile
```
gcc main.c -o traffic -lpthread
```
### Step 2: Execute
```
./traffic
```

**Team Contributions**

* **Sanjana Sirimalla** 
* **V Gayathri** 
* **Hari Hansika** 
* **Lasya** 

**Possible Enhancements**
* Add priority for emergency vehicles
* Implement timer-based signals
* Create a graphical visualization using HTML/JS
* Add real-time logging

**Limitations**
* Console-based simulation (no GUI)
* Fixed number of directions
* No real-time sensor input

**Conclusion**
This project demonstrates how semaphores can be used to control access to shared resources and manage synchronization in concurrent systems. It provides a clear understanding of how traffic systems can be modeled using OS concepts.

**License**
This project is for academic purposes only.
