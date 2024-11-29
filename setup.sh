# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
set -e

export LANGUAGES='en'
do_version_check() {

   if [ "$1" == "$2" ] ; then
    echo "SAME"
    return "$?"
  fi
   ver1front=`echo $1 | cut -d "." -f -1`
   ver1back=`echo $1 | cut -d "." -f 2-`

   ver2front=`echo $2 | cut -d "." -f -1`
   ver2back=`echo $2 | cut -d "." -f 2-`

   if [ "$ver1front" != "$1" ] || [ "$ver2front" != "$2" ]; then
       if [ "$ver1front" -gt "$ver2front" ] ; then
        echo "GREATER"
        return "$?"
      fi
       if [ "$ver1front" -lt "$ver2front" ] ; then
        echo "LOWER"
        return "$?"
      fi


       [ "$ver1front" == "$1" ] || [ -z "$ver1back" ] && ver1back=0
       [ "$ver2front" == "$2" ] || [ -z "$ver2back" ] && ver2back=0
       do_version_check "$ver1back" "$ver2back"
       return "$?"
   else
      if [ "$1" -gt "$2" ] ; then
        echo "GREATER"
         return "$?"
      else
         echo "LOWER"
         return "$?"
      fi
   fi
}

sleep_if_non_ci() {
  if [ "$CI" != "true" ]; then
    sleep $1
  fi
}

DOCKER_STARTED=0
TMUX_STARTED=0

trap ctrl_c INT

function ctrl_c() {
  if [ $DOCKER_STARTED == 1 ]; then
    docker stop $(docker ps -aq)
  fi
  if [ $TMUX_STARTED == 1 ]; then
    tmux kill-session -t opencrvs
  fi
  exit 1
}

echo
echo -e "\033[32m:::::::::::::::::::::::::::: INSTALLING OPEN CRVS ::::::::::::::::::::::::::::\033[0m"
echo -e "\033[32m::::::::::::::::::::: INTERNET CONNECTIVITY IS REQUIRED :::::::::::::::::::::\033[0m"

echo

# Retrieve 2-step verification to continue
#-----------------------------------------
function ask_yes_or_no() {
    read -p "$1 ([y]es or [N]o): "
    case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
        y|yes) echo "yes" ;;
        *)     echo "no" ;;
    esac
}
if [[ "no" == $(ask_yes_or_no "OpenCRVS can ONLY run on Ubuntu, WSL or Mac OSX.  This is a ONE TIME USE ONLY setup command for OpenCRVS and resets OpenCRVS to factory settings.  If you have already successfully installed OpenCRVS, you should use 'yarn dev' to start OpenCRVS again.  Type: no to exit.  If you want to continue, your OS must be Ubuntu or Mac and you must have at least 30 minutes available as the process cannot be interrupted.  You must also have at least 20GB of available disk space and at least 16GB of RAM.  Type: yes to continue.") ]]
then
    echo "Exiting OpenCRVS setup."
    exit 0
fi

echo
echo -e "\033[32m:::::::::::::::::: THIS PROCESS CAN TAKE 15 MINUTES OR MORE ::::::::::::::::::\033[0m"
echo
echo "We will check your dependencies, build docker images, load and configure OpenCRVS. It takes a long time so please be patient and do not quit this process."
echo
sleep_if_non_ci 5
echo "If we recognise that you have not installed a dependency correctly, we will display links to instructions you can follow on 3rd party websites. The links worked at the time of writing but may change. Please let us know on GitHub discussions if you encounter any broken links."
sleep_if_non_ci 5
echo
echo "Installing Docker and Node for example, is outside the scope of this script."
sleep_if_non_ci 10
echo
echo "As part of this script, we checkout another GIT repo: A country configuration module into the folder next to this one called: 'opencrvs-countryconfig'. We do this to make it easy for you to try OpenCRVS.  If you are developing your own country configuration, you should follow our forking instructions at https://documentation.opencrvs.org."
[ -d "../opencrvs-countryconfig" ] && echo "Enter your password to delete the existing country configuration to reset OpenCRVS to factory settings." && sudo rm -r ../opencrvs-countryconfig

sleep_if_non_ci 10
echo
echo -e "\033[32m:::::::::::::::: PLEASE WAIT FOR THE OPEN CRVS LOGO TO APPEAR ::::::::::::::::\033[0m"
echo
sleep_if_non_ci 5

  echo -e "\033[32m:::::::::::::::::::::: Checking your operating systFem ::::::::::::::::::::::\033[0m"
  echo

wslKernelWithUbuntu=false
if  [ -n "$(uname -r | grep microsoft-standard-WSL2)" ] && [ -n "$(cat /etc/os-release | grep Ubuntu)" ]; then
  wslKernelWithUbuntu=true
  echo -e "\033[32m:::::::::::::::: You are running Windows Subsystem for Linux .  Checking distro ::::::::::::::::\033[0m"
  echo
fi

if [  -n "$(uname -a | grep Ubuntu)" ] || [ $wslKernelWithUbuntu == true ]; then
  echo -e "\033[32m:::::::::::::::: You are running Ubuntu.  Checking version ::::::::::::::::\033[0m"
  echo

  OS="UBUNTU"
  ubuntuVersion="$(grep -oP 'VERSION_ID="\K[\d.]+' /etc/os-release)"
  ubuntuVersionTest=$(do_version_check $ubuntuVersion 20.04)
  if [ "$ubuntuVersionTest" == "LOWER" ] ; then
    echo "Sorry your Ubuntu version is not supported.  You must upgrade Ubuntu to 20.04"
    echo "Follow the instructions here: https://ubuntu.com/tutorials/upgrading-ubuntu-desktop#1-before-you-start"
    exit 1
  else
    echo -e "Your Ubuntu version: $ubuntuVersion is \033[32msupported!\033[0m :)"
    echo

    echo -e "\033[32m:::::::: Setting memory requirements for file watch limit and ElasticSearch ::::::::\033[0m"
    echo

    if grep -Fxq "fs.inotify.max_user_watches=524288" /etc/sysctl.conf ; then
        echo "File watch limit already meets requirements."
    else
        echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    fi

    if grep -Fxq "vm.max_map_count=262144" /etc/sysctl.conf ; then
        echo "Max map count already meets requirements."
    else
        echo vm.max_map_count=262144 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    fi
  fi
elif [ "$(uname)" == "Darwin" ]; then
  echo -e "\033[32m::::::::::::::::::::::::: You are running Mac OSX. :::::::::::::::::::::::::\033[0m"
  echo
  OS="MAC"
else
  echo "Sorry your operating system is not supported."
  echo "YOU MUST BE RUNNING A SUPPORTED OS: MAC or UBUNTU > 18.04"
  exit 1
fi

echo -e "\033[32m:::::::: Checking that you have nothing running on OpenCRVS ports ::::::::\033[0m"
echo

echo -e "\033[32m:::::::: Checking that you have the required dependencies installed ::::::::\033[0m"
echo

# Reads .nvmrc and trims the whitespace
nvmVersion=$(cat .nvmrc | tr -d '[:space:]')

dependencies=( "docker" "node" "yarn" "tmux")
for i in "${dependencies[@]}"
do
   :
    if which "$i" >/dev/null; then

        echo -e "✅ $i \033[32minstalled!\033[0m :)"

        sleep_if_non_ci 1
    else
        echo -e "OpenCRVS thinks $i is not installed.\r"
        if [ "$i" == "docker" ] ; then
            if [ $OS == "UBUNTU" ]; then
                echo "You need to install Docker, or if you did, we can't find it and perhaps it is not in your PATH. Please fix your docker installation."
                echo "Please follow the documentation here: https://docs.docker.com/engine/install/ubuntu/"
            else
                echo "You need to install Docker Desktop for Mac, or if you did, we can't find it and perhaps it is not in your PATH. Please fix your docker installation."
                echo "Please follow the documentation here: https://docs.docker.com/desktop/mac/install/"
            fi
        fi
        if [ "$i" == "docker compose" ] ; then
            if [ $OS == "UBUNTU" ]; then
                echo "You need to install Docker Compose, or if you did, we can't find it and perhaps it is not in your PATH. Please fix your docker compose installation."
                echo "Please follow the documentation here: https://docs.docker.com/compose/install/"
            else
                echo "You need to install Docker Desktop for Mac, or if you did, we can't find it and perhaps it is not in your PATH. Please fix your docker installation."
                echo "Please follow the documentation here: https://docs.docker.com/desktop/mac/install/"
            fi
        fi
        if [ "$i" == "node" ] ; then
            echo "You need to install Node, or if you did, we can't find it and perhaps it is not in your PATH. Please fix your node installation."
            echo "We recommend you install Node $nvmVersion as this release has been tested on that version."
            echo "There are various ways you can install Node.  The easiest way to get Node running with the version of your choice is using Node Version Manager."
            echo "Documentation is here: https://nodejs.org/en/download/package-manager/#nvm.  For example run:\033[0m"
            echo "curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash"
            echo "Then use nvm to install the Node version of choice.  For example run:\033[0m"
            echo
            echo "nvm install $nvmVersion"
            echo
            echo "When the version is installed, use it:"
            echo
            echo "nvm use $nvmVersion"
            echo
            echo "Finally set the version to be the default:"
            echo
            echo "nvm alias default $nvmVersion"
        fi
        if [ "$i" == "yarn" ] ; then
           echo "You need to install the Yarn Package Manager for Node."
           echo "The documentation is here: https://classic.yarnpkg.com/en/docs/install"
        fi
        if [ "$i" == "tmux" ] ; then
          if [ $OS == "UBUNTU" ]; then
              echo "OpenCRVS requires multiple terminal windows open in orderRFF to run OpenCRVS Core alongside the default country configuration."
              echo -e "\033[32m::::::::::::: We want to install the tool tmux to do this. :::::::::::::\033[0m"
              echo
              echo -e "\033[32m::::::::::::: Run this command: sudo apt-get install tmux :::::::::::::\033[0m"
          else
              echo "OpenCRVS requires multiple terminal windows open in order to run OpenCRVS Core alongside the default country configuration."
              echo
              echo "We use the tool tmux to do this.  Please install it following the documentation here: https://github.com/tmux/tmux/wiki"
          fi
        fi
        echo
        echo -e "\033[32m::::::::::::::: After $i is installed please try again :::::::::::::::\033[0m"
        echo
        exit 1
    fi
done

###
#
# Check if Docker Compose exists
#
###

if ! docker compose version &> /dev/null
then
    echo "Docker Compose is not available in your Docker installation"
    echo "Your Docker version may be too old to include Docker Compose as part of the Docker CLI."

    if [ $OS == "UBUNTU" ]; then
        echo "Please follow the installation instructions here: https://docs.docker.com/engine/install/ubuntu/"
    else
        echo "Please follow the installation instructions here: https://docs.docker.com/desktop/mac/install/"
    fi

    exit 1
fi

###
#
# Check Node.js version
#
###

echo
echo -e "\033[32m:::::: NOW WE NEED TO CHECK THAT YOUR NODE VERSION IS SUPPORTED ::::::\033[0m"
echo

versionCheckOutput=$(npx --yes check-node-version --package --print 2>&1 || true)
currentVersion=$(echo "$versionCheckOutput" | grep 'node:' | awk '{print $2}')

if echo "$versionCheckOutput" | grep -q 'Wanted node version'; then
  echo "❌ Sorry, your Node version is not supported. Your node version is $currentVersion."
  echo "We recommend you install Node version $nvmVersion as this release has been tested on that version."
  echo "Documentation is here: https://nodejs.org/en/download/package-manager/#nvm"
  echo "Then use nvm to install the Node version of choice. For example run:"
  echo "nvm install $nvmVersion"
  exit 1
else
  echo -e "Your Node version: $currentVersion is \033[32msupported!\033[0m :)"
fi


###
#
# Stop docker containers
#
###

echo
echo -e "\033[32m:::::::::: Stopping any currently running Docker containers ::::::::::\033[0m"
echo
if [[ $(docker ps -aq) ]] ; then
  docker stop $(docker ps -aq)
  sleep_if_non_ci 5
fi

echo
openCRVSPorts=( 3447 9200 27017 6379 8086 4444 3040 5050 2020 7070 9090 1050 3030 3000 3020 2525 2021 3535 3536 9050)
for x in "${openCRVSPorts[@]}"
do
   :
    if lsof -nP -iTCP:$x -sTCP:LISTEN -iUDP:$x >/dev/null; then
      echo -e "❌ OpenCRVS thinks that port: $x is in use by another application.\r"
      echo "You need to find out which application is using this port and quit the application."
      echo "You can find out the application by running:"
      echo "lsof -nP -iTCP:$x -sTCP:LISTEN -iUDP:$x"
      exit 1
    else
        echo -e "✅ $x \033[32m port is available!\033[0m :)"
    fi
done

echo
echo -e "\033[32m:::::::::::::::::::::: Initialising Docker ::::::::::::::::::::::\033[0m"

echo -e "\033[32m:::::::::::::::::: Installing some Node dependencies ::::::::::::::::::\033[0m"
echo
if [ $(which wait-on 2>/dev/null) ]; then
  echo -e "wait-on is \033[32minstalled!\033[0m :)"
else
  echo "wait-on not found"
  npm install -g wait-on
fi
yarn install

echo -e "\033[32m:::::::::::::::::::::: Setting hooks path to .husky ::::::::::::::::::::::\033[0m"
echo
git config --local core.hooksPath .husky/

echo -e "\033[32m::::::::::::::::::::::: Creating some directories :::::::::::::::::::::::\033[0m"
echo
echo -e "\033[32m::::::::::::: Please enter your sudo password when prompted :::::::::::::\033[0m"
echo
if [ -d "data" ] ; then sudo rm -r data ; fi
openssl genrsa -out .secrets/private-key.pem 2048 && openssl rsa -pubout -in .secrets/private-key.pem -out .secrets/public-key.pem
mkdir -p data/elasticsearch
chmod 775 data/elasticsearch

mkdir -p data/mongo
chmod 775 data/mongo
mkdir -p data/influxdb
chmod 775 data/influxdb
mkdir -p data/minio
chmod 775 data/minio

echo -e "\033[32m:::::::::::::::::::: Building OpenCRVS dependencies ::::::::::::::::::::\033[0m"
echo
echo "This can take some time on slow connections.  Docker is downloading Mongo DB, ElasticSearch and Hearth docker images.  These are large files.  Then it will build them."
echo
if [ $OS == "MAC" ]; then
 export LOCAL_IP=host-gateway
fi
yarn compose:deps:detached

# As this script is also used when setting up E2E tests,
# where we don't want to start the app in tmux. This script ends.
if [[ $CI == "true" ]]; then
 exit 0
fi

DOCKER_STARTED=1
echo "wait-on tcp:3447" && wait-on -l tcp:3447
echo "wait-on http://localhost:9200" && wait-on -l http://localhost:9200
echo "wait-on tcp:9200" && wait-on -l tcp:9200
echo "wait-on tcp:27017" && wait-on -l tcp:27017
echo "wait-on tcp:6379" && wait-on -l tcp:6379
echo "wait-on tcp:8086" && wait-on -l tcp:8086
echo "wait-on tcp:3535" && wait-on -l tcp:3535


set -- $(stty size) #$1=rows, $2=columns

#start a new session in dettached mode with resizable panes
tmux new-session -s opencrvs -n opencrvs -d -x "$2" -y "$(($1 - 1))"
TMUX_STARTED=1
tmux set -p @mytitle "opencrvs-core-working"
tmux send-keys -t opencrvs "bash development-environment/summary.sh" C-m
tmux split-window -h -l '30%'
tmux send-keys -t opencrvs "LANGUAGES=en && yarn start" C-m
tmux set -p @mytitle "opencrvs-core"
tmux split-window -v
tmux set -p @mytitle "opencrvs-countryconfig"
DIR=$(cd "$(dirname "$0")"; pwd)
tmux send-keys -t opencrvs "bash development-environment/setup-countryconfig.sh $DIR" C-m
tmux setw -g mouse on
tmux attach -t opencrvs

