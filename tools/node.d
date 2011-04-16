#!/bin/bash

daemon_name=node
daemon_script=/home/git/server/index.coffee

 . /etc/rc.conf
 . /etc/rc.d/functions

case "$1" in
  start)
    stat_busy "Starting $daemon_name daemon"
    if [ ! -d /var/log/$daemon_name ]; then 
      mkdir /var/log/$daemon_name
      chown $daemon_user:$daemon_user /var/log
    fi

    if [ ! -d /var/run/$daemon_name ]; then
      mkdir /var/run/$daemon_name
      chown $daemon_user:$daemon_user /var/run
    fi

    nohup /usr/bin/node /home/git/server > /var/log/node/node.log

    if [ $? -gt 0 ]; then
      stat_fail
      exit 1
    else
      add_daemon $daemon_name
      stat_done
    fi
    ;;

  stop)
    stat_busy "Stopping $daemon_name daemon"
    pkill node
    if [ $? -gt 0 ]; then
      stat_fail
      exit 1
    else
      rm_daemon $daemon_name
      stat_done
    fi
    ;;

  restart)
    $0 stop
    sleep 1
    $0 start
    ;;

  status)
    stat_busy "Checking $daemon_name status";
    ck_status $daemon_name
    ;;

  *)
    echo "usage: $0 {start|stop|restart|status}"  
esac
exit 0
