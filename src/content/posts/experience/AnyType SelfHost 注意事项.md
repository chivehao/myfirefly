---
title: AnyType SelfHost 注意事项
published: 2026-01-15
image: 'https://imgbed.ikaros.run/file/posts/1769414769329_20260126160601432.png'
category: '经验总结'
tags: ["开源", "自部署"]
---

## 前言
我是因为CPU不支持AVX所有需要做些额外操作。   



## 安装   
这块只需要安装官方文档一步步来就行了:   
[https://github.com/anyproto/any-sync-dockercompose?tab=readme-ov-file#getting-started](https://github.com/anyproto/any-sync-dockercompose?tab=readme-ov-file#getting-started)    
## 更改MonogoDb版本   
这块安装官方文档来就行   
[https://github.com/anyproto/any-sync-dockercompose/wiki/Troubleshooting-&-FAQ#mongodb-requires-a-cpu-with-avx-support](https://github.com/anyproto/any-sync-dockercompose/wiki/Troubleshooting-&-FAQ#mongodb-requires-a-cpu-with-avx-support) 
   
## 其它操作    
我这边启动时出现了如下问题：   
```
service "any-sync-coordinator_bootstrap" didn't complete successfully: exit 1
make: *** [Makefile:24: start] Error 1
```
需要进MonogoDB容器里做些操作：   
```
docker exec -it any-sync-dockercompose-mongo-1-1 mongo --port 27001 --eval 'rs.reconfig({_id: rs.conf()._id, members: [{ _id: 0, host: "mongo-1:27001" }]}, {force: true});'
```
然后重启就行：   
```
make restart

```
操作期间，你可以进MongoDB容器查询数据库的状态：   
进容器：   
```
docker exec -it any-sync-dockercompose-mongo-1-1 mongo  --port 27001
```
查询状态：   
```
rs.status()

```
## 客户端使用   
当前通过 make start启动没有问题后，会提示以下信息：   
```
Done! Upload your self-hosted network configuration file /opt/1panel/apps/anytype/any-sync-dockercompose/etc/client.yml into the client app
See: https://doc.anytype.io/anytype-docs/data-and-security/self-hosting#switching-between-networks
```
按照提示，去下载当前的目录下的 /etc/client.yaml 到你的电脑或者手机里   
客户端里选择自托管，然后读取这个下载的文件就行，后续的操作和其它方式一样的。   

## 总结
初步体验下来，Anytype给我的感觉就是不用写代码的数据库表，但目前没插件功能，生态也不完善，只能说是未来可期。

如果是打算整个比如追番数据库啥的，不太推荐，除非你不介意比较繁琐的类型和属性配置，一点点自己构建，那样的话也行。

我是打算用来弄我自己的小说大纲的，感觉挺合适的。

## 完整的Shell日志   
```
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# make restart
docker compose down --remove-orphans
[+] Running 15/15
 ✔ Container any-sync-dockercompose-create-bucket-1                   Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-netcheck-1                        R...                                               0.0s 
 ✔ Container any-sync-dockercompose-any-sync-filenode-1               Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-1-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-2-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-3-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-consensusnode-1          Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-minio-1                           Remo...                                            0.6s 
 ✔ Container any-sync-dockercompose-redis-1                           Remo...                                            0.7s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator-1            Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator_bootstrap-1  Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-mongo-1-1                         Re...                                              0.7s 
 ✔ Container any-sync-dockercompose-generateconfig-processing-1       Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-generateconfig-anyconf-1          Removed                                            0.0s 
 ✔ Network any-sync-dockercompose_default                             Remove...                                          0.1s 
docker buildx build --load --tag generateconfig-env --file Dockerfile-generateconfig-env .
[+] Building 4.4s (11/11) FINISHED                                                                             docker:default
 => [internal] load build definition from Dockerfile-generateconfig-env                                                  0.0s
 => => transferring dockerfile: 286B                                                                                     0.0s
 => resolve image config for docker-image://docker.io/docker/dockerfile:1                                                2.3s
 => CACHED docker-image://docker.io/docker/dockerfile:1@sha256:b6afd42430b15f2d2a4c5a02b919e98a525b785b1aaff16747d2f623  0.0s
 => [internal] load metadata for docker.io/library/python:3.11-alpine                                                    1.7s
 => [internal] load .dockerignore                                                                                        0.0s
 => => transferring context: 2B                                                                                          0.0s
 => [1/4] FROM docker.io/library/python:3.11-alpine@sha256:c825a02ff096b3dc3d362015f9e9f6527f66b73e11f9ad2db1f0da4e09ba  0.0s
 => [internal] load build context                                                                                        0.0s
 => => transferring context: 104B                                                                                        0.0s
 => CACHED [2/4] WORKDIR /code                                                                                           0.0s
 => CACHED [3/4] COPY docker-generateconfig/env-requirements.txt requirements.txt                                        0.0s
 => CACHED [4/4] RUN pip install -r requirements.txt                                                                     0.0s
 => exporting to image                                                                                                   0.0s
 => => exporting layers                                                                                                  0.0s
 => => writing image sha256:17cd9ae9040c4d11bee3d75c515dab3a34fbffbaecfe236955678d50bbd14500                             0.0s
 => => naming to docker.io/library/generateconfig-env                                                                    0.0s
docker run --rm \
        --volume /opt/1panel/apps/anytype/any-sync-dockercompose/:/code/:Z \
        generateconfig-env
docker compose up --detach --remove-orphans --quiet-pull
[+] Running 1/1
 ✔ netcheck Pulled                                                                                                       2.4s 
[+] Running 15/15
 ✔ Network any-sync-dockercompose_default                             Create...                                          0.1s 
 ✔ Container any-sync-dockercompose-generateconfig-anyconf-1          Exited                                             2.2s 
 ✔ Container any-sync-dockercompose-minio-1                           Star...                                            1.5s 
 ✔ Container any-sync-dockercompose-generateconfig-processing-1       Exited                                            11.5s 
 ✔ Container any-sync-dockercompose-create-bucket-1                   Started                                            2.3s 
 ✔ Container any-sync-dockercompose-mongo-1-1                         He...                                             11.5s 
 ✔ Container any-sync-dockercompose-redis-1                           Star...                                            4.8s 
 ✘ Container any-sync-dockercompose-any-sync-coordinator_bootstrap-1  service "any-sync-coordinator_bootstrap" didn't complete successfully: exit 141.4s rcompose-any-sync-coordinator-1            Created                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator-1            Created                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-1-1                 Created                                            0.2s 
 ✔ Container any-sync-dockercompose-any-sync-consensusnode-1          Created                                            0.2s 
 ✔ Container any-sync-dockercompose-any-sync-node-2-1                 Created                                            0.2s 
 ✔ Container any-sync-dockercompose-any-sync-node-3-1                 Created                                            0.2s 
 ✔ Container any-sync-dockercompose-any-sync-filenode-1               Created                                            0.2s 
 ✔ Container any-sync-dockercompose-netcheck-1                        C...                                               0.1s 
service "any-sync-coordinator_bootstrap" didn't complete successfully: exit 1
make: *** [Makefile:24: start] Error 1
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# docker compose exec mongo-1 mongosh --port 27001 --eval 'rs.reconfig({_id: rs.conf()._id, members: [{ _id: 0, host: "mongo-1:27001" }]}, {force: true});'
OCI runtime exec failed: exec failed: unable to start container process: exec: "mongosh": executable file not found in $PATH: unknown
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# docker exec -it any-sync-dockercompose-mongo-1-1 mongosh --port 27001
OCI runtime exec failed: exec failed: unable to start container process: exec: "mongosh": executable file not found in $PATH: unknown
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# docker exec -it any-sync-dockercompose-mongo-1-1 mongo  --port 27001
MongoDB shell version v4.4.30
connecting to: mongodb://127.0.0.1:27001/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("c5761830-91ae-4e8e-9293-80553458c4de") }
MongoDB server version: 4.4.30
---
The server generated these startup warnings when booting: 
        2026-01-12T17:39:33.400+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
        2026-01-12T17:39:35.292+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
---
> rs.status()
{
        "ok" : 0,
        "errmsg" : "Our replica set config is invalid or we are not a member of it",
        "code" : 93,
        "codeName" : "InvalidReplicaSetConfig"
}
> exit
bye
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# docker exec -it any-sync-dockercompose-mongo-1-1 mongo --port 27001 --eval 'rs.reconfig({_id: rs.conf()._id, members: [{ _id: 0, host: "mongo-1:27001" }]}, {force: true});'
MongoDB shell version v4.4.30
connecting to: mongodb://127.0.0.1:27001/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("c387e6f6-ac09-475f-99b0-3f4211c34bb7") }
MongoDB server version: 4.4.30
{ "ok" : 1 }
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# docker exec -it any-sync-dockercompose-mongo-1-1 mongo  --port 27001
MongoDB shell version v4.4.30
connecting to: mongodb://127.0.0.1:27001/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("ead9003a-0b7c-43c7-9256-5d9f47125827") }
MongoDB server version: 4.4.30
---
The server generated these startup warnings when booting: 
        2026-01-12T17:39:33.400+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
        2026-01-12T17:39:35.292+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
---
rs0:PRIMARY> rs.status()
{
        "set" : "rs0",
        "date" : ISODate("2026-01-12T17:50:23.580Z"),
        "myState" : 1,
        "term" : NumberLong(2),
        "syncSourceHost" : "",
        "syncSourceId" : -1,
        "heartbeatIntervalMillis" : NumberLong(2000),
        "majorityVoteCount" : 1,
        "writeMajorityCount" : 1,
        "votingMembersCount" : 1,
        "writableVotingMembersCount" : 1,
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1768240215, 1),
                        "t" : NumberLong(2)
                },
                "lastCommittedWallTime" : ISODate("2026-01-12T17:50:15.019Z"),
                "readConcernMajorityOpTime" : {
                        "ts" : Timestamp(1768240215, 1),
                        "t" : NumberLong(2)
                },
                "readConcernMajorityWallTime" : ISODate("2026-01-12T17:50:15.019Z"),
                "appliedOpTime" : {
                        "ts" : Timestamp(1768240215, 1),
                        "t" : NumberLong(2)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1768240215, 1),
                        "t" : NumberLong(2)
                },
                "lastAppliedWallTime" : ISODate("2026-01-12T17:50:15.019Z"),
                "lastDurableWallTime" : ISODate("2026-01-12T17:50:15.019Z")
        },
        "lastStableRecoveryTimestamp" : Timestamp(1768239337, 1),
        "electionCandidateMetrics" : {
                "lastElectionReason" : "electionTimeout",
                "lastElectionDate" : ISODate("2026-01-12T17:50:04.988Z"),
                "electionTerm" : NumberLong(2),
                "lastCommittedOpTimeAtElection" : {
                        "ts" : Timestamp(0, 0),
                        "t" : NumberLong(-1)
                },
                "lastSeenOpTimeAtElection" : {
                        "ts" : Timestamp(1768239357, 1),
                        "t" : NumberLong(1)
                },
                "numVotesNeeded" : 1,
                "priorityAtElection" : 1,
                "electionTimeoutMillis" : NumberLong(10000),
                "newTermStartDate" : ISODate("2026-01-12T17:50:05.016Z"),
                "wMajorityWriteAvailabilityDate" : ISODate("2026-01-12T17:50:05.093Z")
        },
        "members" : [
                {
                        "_id" : 0,
                        "name" : "mongo-1:27001",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 650,
                        "optime" : {
                                "ts" : Timestamp(1768240215, 1),
                                "t" : NumberLong(2)
                        },
                        "optimeDate" : ISODate("2026-01-12T17:50:15Z"),
                        "lastAppliedWallTime" : ISODate("2026-01-12T17:50:15.019Z"),
                        "lastDurableWallTime" : ISODate("2026-01-12T17:50:15.019Z"),
                        "syncSourceHost" : "",
                        "syncSourceId" : -1,
                        "infoMessage" : "Could not find member to sync from",
                        "electionTime" : Timestamp(1768240204, 1),
                        "electionDate" : ISODate("2026-01-12T17:50:04Z"),
                        "configVersion" : 80850,
                        "configTerm" : -1,
                        "self" : true,
                        "lastHeartbeatMessage" : ""
                }
        ],
        "ok" : 1,
        "$clusterTime" : {
                "clusterTime" : Timestamp(1768240215, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        },
        "operationTime" : Timestamp(1768240215, 1)
}
rs0:PRIMARY> exit
bye
root@production:/opt/1panel/apps/anytype/any-sync-dockercompose# make restart
docker compose down --remove-orphans
[+] Running 15/15
 ✔ Container any-sync-dockercompose-create-bucket-1                   Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-netcheck-1                        R...                                               0.0s 
 ✔ Container any-sync-dockercompose-any-sync-filenode-1               Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-1-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-2-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-3-1                 Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-consensusnode-1          Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-minio-1                           Remo...                                            0.6s 
 ✔ Container any-sync-dockercompose-redis-1                           Remo...                                            0.5s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator-1            Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator_bootstrap-1  Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-mongo-1-1                         Re...                                              1.1s 
 ✔ Container any-sync-dockercompose-generateconfig-processing-1       Removed                                            0.0s 
 ✔ Container any-sync-dockercompose-generateconfig-anyconf-1          Removed                                            0.0s 
 ✔ Network any-sync-dockercompose_default                             Remove...                                          0.1s 
docker buildx build --load --tag generateconfig-env --file Dockerfile-generateconfig-env .
[+] Building 4.4s (11/11) FINISHED                                                                             docker:default
 => [internal] load build definition from Dockerfile-generateconfig-env                                                  0.0s
 => => transferring dockerfile: 286B                                                                                     0.0s
 => resolve image config for docker-image://docker.io/docker/dockerfile:1                                                2.3s
 => CACHED docker-image://docker.io/docker/dockerfile:1@sha256:b6afd42430b15f2d2a4c5a02b919e98a525b785b1aaff16747d2f623  0.0s
 => [internal] load metadata for docker.io/library/python:3.11-alpine                                                    1.7s
 => [internal] load .dockerignore                                                                                        0.0s
 => => transferring context: 2B                                                                                          0.0s
 => [internal] load build context                                                                                        0.0s
 => => transferring context: 104B                                                                                        0.0s
 => [1/4] FROM docker.io/library/python:3.11-alpine@sha256:c825a02ff096b3dc3d362015f9e9f6527f66b73e11f9ad2db1f0da4e09ba  0.0s
 => CACHED [2/4] WORKDIR /code                                                                                           0.0s
 => CACHED [3/4] COPY docker-generateconfig/env-requirements.txt requirements.txt                                        0.0s
 => CACHED [4/4] RUN pip install -r requirements.txt                                                                     0.0s
 => exporting to image                                                                                                   0.0s
 => => exporting layers                                                                                                  0.0s
 => => writing image sha256:17cd9ae9040c4d11bee3d75c515dab3a34fbffbaecfe236955678d50bbd14500                             0.0s
 => => naming to docker.io/library/generateconfig-env                                                                    0.0s
docker run --rm \
        --volume /opt/1panel/apps/anytype/any-sync-dockercompose/:/code/:Z \
        generateconfig-env
docker compose up --detach --remove-orphans --quiet-pull
[+] Running 1/1
 ✔ netcheck Pulled                                                                                                       2.4s 
[+] Running 15/15
 ✔ Network any-sync-dockercompose_default                             Create...                                          0.1s 
 ✔ Container any-sync-dockercompose-minio-1                           Heal...                                           13.4s 
 ✔ Container any-sync-dockercompose-generateconfig-anyconf-1          Exited                                             2.4s 
 ✔ Container any-sync-dockercompose-generateconfig-processing-1       Exited                                            12.1s 
 ✔ Container any-sync-dockercompose-create-bucket-1                   Started                                            2.5s 
 ✔ Container any-sync-dockercompose-mongo-1-1                         He...                                             12.0s 
 ✔ Container any-sync-dockercompose-redis-1                           Heal...                                           16.1s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator_bootstrap-1  Exited                                            11.9s 
 ✔ Container any-sync-dockercompose-any-sync-coordinator-1            Started                                           12.4s 
 ✔ Container any-sync-dockercompose-any-sync-filenode-1               Started                                           16.9s 
 ✔ Container any-sync-dockercompose-any-sync-node-1-1                 Started                                           15.0s 
 ✔ Container any-sync-dockercompose-any-sync-node-2-1                 Started                                           14.5s 
 ✔ Container any-sync-dockercompose-any-sync-node-3-1                 Started                                           16.4s 
 ✔ Container any-sync-dockercompose-any-sync-consensusnode-1          Started                                           15.6s 
 ✔ Container any-sync-dockercompose-netcheck-1                        S...                                              17.8s 
Done! Upload your self-hosted network configuration file /opt/1panel/apps/anytype/any-sync-dockercompose/etc/client.yml into the client app
See: https://doc.anytype.io/anytype-docs/data-and-security/self-hosting#switching-between-networks
```
   
