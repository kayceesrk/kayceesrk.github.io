#!/bin/bash

SEEDS=172.30.0.51
CLUSTERNAME=QueleaCluster
MYIP=`ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p'`
wget http://kcsrk.info/cassandra.yaml.Ec2Snitch
mv cassandra.yaml.En2Snitch cassandra.yaml
perl -p -i -e "s/__NAME/$CLUSTERNAME/g" cassandra.yaml
perl -p -i -e "s/__MYIP/$MYIP/g" cassandra.yaml
perl -p -i -e "s/__SEEDS/$SEEDS/g" cassandra.yaml
mv cassandra.yaml /etc/cassandra/
